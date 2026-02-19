import { upload } from '@/utils/upload';
import { getSession } from '@/utils/getSession';

export async function POST(request) {
  const { image_url, description } = await request.json();
  const session = await getSession();
  const safetyPrompt =
    'Make a 3d cartoonish interpretation that would not scare children and for a child audience. Keep it as close and faithful to the original image as possible.';

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' });
  }

  if (!image_url) {
    return Response.json({ error: 'Image URL is required' });
  }

  if (!description) {
    return Response.json({ error: 'Description is required' });
  }

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('output_type', 'URL');
    formData.append('description', `${description}. ${safetyPrompt}`);

    // Handle image data
    const imgRes = await fetch(image_url);
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType =
      imgRes.headers.get('content-type') || 'application/octet-stream';
    const file = new File([arrayBuffer], 'upload', { type: contentType });
    formData.append('existing_image', file);

    // Make request to Worqhat
    const worqhatResponse = await fetch(
      'https://api.worqhat.com/api/ai/images/modify/v3/sketch-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WORQHAT_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!worqhatResponse.ok) {
      const errorData = await worqhatResponse.json();
      throw new Error(errorData.message || 'API request failed');
    }

    const data = await worqhatResponse.json();

    if (!data.image) {
      throw new Error('No modified image URL received');
    }

    // Upload the image to our storage
    const { url: storedImageUrl, error: uploadError } = await upload({
      url: data.image,
    });

    if (uploadError) {
      throw new Error(`Failed to upload generated image: ${uploadError}`);
    }

    return Response.json({
      success: true,
      enhanced_url: storedImageUrl,
    });
  } catch (error) {
    console.error('Error modifying image:', error);
    return Response.json({ error: error.message || 'Failed to modify image' });
  }
}

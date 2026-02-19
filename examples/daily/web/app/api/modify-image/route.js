import getSession from '@/utils/getSession';

export async function POST(request) {
  const { image_url, description } = await request.json();
  const session = await getSession();
  const safetyPrompt =
    'Make a 3d cartoonish interpretation that would not scare children and for a child audience. Keep it as close and faithful to the original image as possible.';
  const prompt = `${description}. ${safetyPrompt}`;
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' });
  }

  if (!image_url) {
    return Response.json({ error: 'Image URL is required' });
  }

  if (!prompt) {
    return Response.json({ error: 'Prompt is required' });
  }

  try {
    // First, fetch the image from the URL
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch source image');
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get('content-type') || 'image/png';

    // Create form data
    const formData = new FormData();
    formData.append(
      'image',
      new File([imageArrayBuffer], 'image.png', { type: contentType })
    );
    formData.append('prompt', prompt);
    formData.append('model', 'gpt-image-1');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();

    // Upload the base64 data directly to Uploadcare
    const { url: uploadedUrl, error: uploadError } = await upload({
      base64: `data:image/png;base64,${data.data[0].b64_json}`,
    });

    if (uploadError) {
      throw new Error(uploadError);
    }
    return Response.json({
      success: true,
      enhanced_url: uploadedUrl,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({
      error: error.message || 'Failed to generate image',
    });
  }
}

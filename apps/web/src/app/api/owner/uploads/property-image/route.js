import crypto from 'node:crypto';
import { requireRoles } from '@/app/api/utils/session';

function cloudinaryEnv() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

function createSignature({ folder, timestamp, apiSecret }) {
  const data = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  return crypto.createHash('sha1').update(data).digest('hex');
}

export async function POST(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json(
      { error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET.' },
      { status: 500 }
    );
  }

  try {
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();
    let fileForCloudinary = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return Response.json({ error: 'Image file is required' }, { status: 400 });
      }
      fileForCloudinary = file;
    } else {
      const payload = await request.json().catch(() => ({}));
      const dataUrl = String(payload.dataUrl || payload.base64 || '').trim();
      if (!dataUrl) {
        return Response.json({ error: 'Image file is required' }, { status: 400 });
      }
      fileForCloudinary = dataUrl;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'findnearpg/properties';
    const signature = createSignature({ folder, timestamp, apiSecret });

    const cloudinaryData = new FormData();
    cloudinaryData.append('file', fileForCloudinary);
    cloudinaryData.append('api_key', apiKey);
    cloudinaryData.append('timestamp', String(timestamp));
    cloudinaryData.append('folder', folder);
    cloudinaryData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryData,
    });

    const json = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: json?.error?.message || 'Failed to upload image to Cloudinary' },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      imageUrl: json.secure_url,
      publicId: json.public_id,
      width: json.width,
      height: json.height,
      format: json.format,
      bytes: json.bytes,
    });
  } catch (error) {
    console.error('Owner image upload failed:', error);
    return Response.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

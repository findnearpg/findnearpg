import sql from '@/utils/sql';
import getSession from '@/utils/getSession';

export async function POST(request) {
  const { image_url } = await request.json();
  const session = await getSession();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  if (!image_url) {
    return { error: 'Image URL is required' };
  }

  try {
    const [snapshot] = await sql`
      INSERT INTO snapshots ("userId", image_url)
      VALUES (${session.user.id}, ${image_url})
      RETURNING id, image_url, created_at
    `;

    return Response.json({ snapshot });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return Response.json({ error: 'Failed to create snapshot' });
  }
}

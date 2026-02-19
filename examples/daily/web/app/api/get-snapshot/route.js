import sql from '@/utils/sql';
import getSession from '@/utils/getSession';

export async function POST({ id }) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' });
  }

  if (!id) {
    return Response.json({ error: 'Snapshot ID is required' });
  }

  try {
    const [snapshot] = await sql`
      SELECT id, image_url, created_at, enhanced_image_url
      FROM snapshots 
      WHERE id = ${id} AND "userId" = ${session.user.id}
    `;

    if (!snapshot) {
      return Response.json({ error: 'Snapshot not found' });
    }

    return Response.json({ snapshot });
  } catch (error) {
    return Response.json({ error: 'Failed to retrieve snapshot' });
  }
}

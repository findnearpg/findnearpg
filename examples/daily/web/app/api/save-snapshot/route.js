import sql from '@/utils/sql';
import getSession from '@/utils/getSession';
export async function POST(request) {
  const { id, enhanced_image_url } = await request.json();
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' });
  }

  if (!enhanced_image_url) {
    return Response.json({ error: 'Enhanced image URL is required' });
  }

  try {
    const [snapshot] = await sql`
      UPDATE snapshots 
      SET enhanced_image_url = ${enhanced_image_url}
      WHERE id = ${id}::uuid
      AND "userId" = ${session.user.id}
      RETURNING id, enhanced_image_url
    `;

    if (!snapshot) {
      return Response.json({ error: 'Snapshot not found or unauthorized' });
    }

    return Response.json({ snapshot });
  } catch (error) {
    console.error('Error updating snapshot:', error);
    return Response.json({ error: 'Failed to update snapshot' });
  }
}

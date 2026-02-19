import getSession from '@/utils/getSession';
import sql from '@/utils/sql';

export async function POST() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' });
  }

  try {
    const snapshots = await sql`
      SELECT id, image_url, created_at, title
      FROM snapshots 
      WHERE "userId" = ${session.user.id}
      ORDER BY created_at DESC
    `;

    return Response.json({
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
      })),
    });
  } catch (error) {
    console.error('Error in list-snapshots:', error);
    return Response.json({ error: 'Failed to retrieve snapshots' });
  }
}

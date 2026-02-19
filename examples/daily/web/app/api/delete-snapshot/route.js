import sql from '@/utils/sql';
import getSession from '@/utils/getSession';

export async function POST(request) {
  const { id } = await request.json();
  const session = await getSession();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  if (!id) {
    return { error: 'Snapshot ID is required' };
  }

  try {
    const [deletedSnapshot] = await sql`
      DELETE FROM snapshots 
      WHERE id = ${id}::uuid 
      AND "userId" = ${session.user.id}
      RETURNING id
    `;

    if (!deletedSnapshot) {
      return { error: 'Snapshot not found or unauthorized' };
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    return Response.json({ error: 'Failed to delete snapshot' });
  }
}

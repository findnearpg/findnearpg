import sql from '@/utils/sql';
import getSession from '@/utils/getSession';

export async function POST() {
  const session = await getSession();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    await sql.transaction([
      sql`DELETE FROM snapshots WHERE "userId" = ${session.user.id}`,
      sql`DELETE FROM auth_users WHERE id = ${session.user.id}`,
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: 'Failed to delete account' });
  }
}

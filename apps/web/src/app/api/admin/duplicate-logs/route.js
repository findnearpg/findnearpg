import { listDuplicateGuardLogs } from '@/app/api/utils/duplicate-guard-logs';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 50);
    const entityType = String(searchParams.get('entityType') || '').trim();
    const reasonCode = String(searchParams.get('reasonCode') || '').trim();

    const items = await listDuplicateGuardLogs({
      limit,
      entityType,
      reasonCode,
    });

    return Response.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error('Failed to fetch duplicate guard logs:', error);
    return Response.json({ error: 'Failed to fetch duplicate guard logs' }, { status: 500 });
  }
}

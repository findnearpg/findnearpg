import { requireRoles } from '@/app/api/utils/session';
import { getAdminRiskDashboard } from '@/app/api/utils/suspicious-monitor';

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const limit = Number(new URL(request.url).searchParams.get('limit') || 20);
    const data = await getAdminRiskDashboard(limit);
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch admin risk dashboard:', error);
    return Response.json({ error: 'Failed to fetch risk dashboard' }, { status: 500 });
  }
}

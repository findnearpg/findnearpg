import { getPropertiesCollection, mapPropertyDoc } from '@/app/api/utils/mongo-collections';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const ownerIdParam = Number(searchParams.get('ownerId'));
    const ownerId = auth.session.userId ? Number(auth.session.userId) : ownerIdParam;

    if (!ownerId && auth.session.role !== 'admin') {
      return Response.json({ error: 'ownerId is required' }, { status: 400 });
    }

    const properties = await getPropertiesCollection();
    const query = auth.session.role === 'admin' && !ownerId ? {} : { owner_id: ownerId };

    const docs = await properties.find(query).sort({ created_at: -1 }).limit(100).toArray();
    return Response.json(docs.map(mapPropertyDoc));
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    return Response.json({ error: 'Failed to fetch owner properties' }, { status: 500 });
  }
}

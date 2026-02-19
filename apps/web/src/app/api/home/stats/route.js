import { getMongoDb } from '@/app/api/utils/mongodb';
import { getCachedValue, setCachedValue } from '@/app/api/utils/response-cache';

function canonicalCityName(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) return '';
  if (normalized === 'bangalore' || normalized === 'bengaluru' || normalized === 'bengalooru')
    return 'Bengaluru';
  if (normalized === 'hydrabad' || normalized === 'hyderbad' || normalized === 'hyderabad')
    return 'Hyderabad';
  if (normalized === 'bombay' || normalized === 'mumbai') return 'Mumbai';
  if (normalized === 'new delhi' || normalized === 'delhi') return 'Delhi';
  if (normalized === 'madras' || normalized === 'chennai') return 'Chennai';
  return String(value || '').trim();
}

export async function GET() {
  const cached = getCachedValue('home:stats', 'v2');
  if (cached) return Response.json(cached);

  try {
    const db = await getMongoDb();
    const propertiesCol = db.collection('properties');
    const usersCol = db.collection('users');
    const ownersCol = db.collection('owners');

    const liveFilter = {
      $or: [{ listing_status: 'live' }, { is_approved: true }],
    };

    const [cityAgg, propertiesCountAgg, userCount, verifiedOwners] = await Promise.all([
      propertiesCol
        .aggregate([
          { $match: liveFilter },
          { $group: { _id: '$city', count: { $sum: 1 } } },
        ])
        .toArray(),
      propertiesCol
        .aggregate([{ $match: liveFilter }, { $count: 'total' }])
        .toArray(),
      usersCol.countDocuments({ role: 'user' }),
      ownersCol.countDocuments({ verificationStatus: 'approved' }),
    ]);

    const cityCountMap = new Map();
    for (const item of cityAgg) {
      const city = canonicalCityName(item?._id);
      if (!city) continue;
      cityCountMap.set(city, Number(cityCountMap.get(city) || 0) + Number(item?.count || 0));
    }

    const legacyOwnerCount = await usersCol.countDocuments({ role: 'owner' });
    const ownersCount = verifiedOwners > 0 ? verifiedOwners : legacyOwnerCount;
    const totalProperties = Number(propertiesCountAgg?.[0]?.total || 0);

    const result = {
      totals: {
        properties: totalProperties,
        owners: ownersCount,
        users: Number(userCount || 0),
        citiesCovered: cityCountMap.size,
      },
      cityCounts: Object.fromEntries(cityCountMap.entries()),
    };

    setCachedValue('home:stats', 'v2', result, 60_000);
    return Response.json(result);
  } catch (error) {
    console.error('Failed to fetch home stats:', error);
    return Response.json({ error: 'Failed to fetch home stats' }, { status: 500 });
  }
}

import { getMongoDb } from '@/app/api/utils/mongodb';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const db = await getMongoDb();
    const usersCol = db.collection('users');
    const bookingsCol = db.collection('bookings');

    const users = await usersCol
      .find(
        { role: { $in: ['user', 'tenant'] } },
        {
          projection: {
            userId: 1,
            id: 1,
            name: 1,
            email: 1,
            phone: 1,
            mobile: 1,
            createdAt: 1,
            updatedAt: 1,
            role: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    const userIds = users.map((user) => Number(user.userId || user.id)).filter(Number.isFinite);

    const bookingCounts = await bookingsCol
      .aggregate([
        { $match: { user_id: { $in: userIds } } },
        { $group: { _id: '$user_id', total: { $sum: 1 } } },
      ])
      .toArray();
    const bookingMap = new Map(
      bookingCounts.map((item) => [Number(item._id), Number(item.total || 0)])
    );

    const result = users.map((user) => {
      const id = Number(user.userId || user.id);
      return {
        id,
        name: user.name || '-',
        email: user.email || '-',
        phone: user.phone || user.mobile || '-',
        role: user.role === 'tenant' ? 'user' : user.role,
        bookings: bookingMap.get(id) || 0,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    return Response.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

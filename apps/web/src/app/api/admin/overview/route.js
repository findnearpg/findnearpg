import { getMongoDb } from '@/app/api/utils/mongodb';
import { requireRoles } from '@/app/api/utils/session';

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}`;
}

function getYearKey(date) {
  return String(date.getUTCFullYear());
}

function buildSeries(keys) {
  const map = new Map();
  for (const key of keys) {
    map.set(key, { key, bookings: 0, paidBookings: 0, paidAmount: 0, commission: 0 });
  }
  return map;
}

function normalizeFilters(searchParams) {
  const city = String(searchParams.get('city') || '')
    .trim()
    .toLowerCase();
  const ownerIdRaw = searchParams.get('ownerId');
  const ownerId = ownerIdRaw ? Number(ownerIdRaw) : null;
  const from = toDate(searchParams.get('from'));
  const to = toDate(searchParams.get('to'));
  if (to) to.setHours(23, 59, 59, 999);
  return {
    city: city || null,
    ownerId: Number.isFinite(ownerId) ? ownerId : null,
    from,
    to,
  };
}

export async function buildAdminOverview(filters = {}) {
  const db = await getMongoDb();
  const propertiesCol = db.collection('properties');
  const bookingsCol = db.collection('bookings');
  const usersCol = db.collection('users');
  const ownersCol = db.collection('owners');
  const paymentsCol = db.collection('payments');

  const [properties, bookings, users, ownerCount, paymentsCount] = await Promise.all([
    propertiesCol
      .find(
        {},
        { projection: { id: 1, owner_id: 1, city: 1, is_approved: 1, listing_status: 1, title: 1 } }
      )
      .toArray(),
    bookingsCol
      .find(
        {},
        {
          projection: {
            id: 1,
            property_id: 1,
            user_id: 1,
            payment_status: 1,
            booking_status: 1,
            amount: 1,
            token_amount: 1,
            rent_amount: 1,
            created_at: 1,
          },
        }
      )
      .toArray(),
    usersCol.find({}, { projection: { role: 1 } }).toArray(),
    ownersCol.countDocuments({}),
    paymentsCol.countDocuments({}),
  ]);

  const propertyById = new Map(properties.map((property) => [Number(property.id), property]));

  const filteredProperties = properties.filter((property) => {
    if (filters.ownerId && Number(property.owner_id) !== Number(filters.ownerId)) return false;
    if (
      filters.city &&
      String(property.city || '')
        .trim()
        .toLowerCase() !== filters.city
    )
      return false;
    return true;
  });
  const filteredPropertyIds = new Set(filteredProperties.map((property) => Number(property.id)));

  const now = new Date();
  const sevenDays = [];
  for (let index = 6; index >= 0; index -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - index);
    sevenDays.push(getDateKey(startOfDay(day)));
  }

  const twelveMonths = [];
  for (let index = 11; index >= 0; index -= 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    twelveMonths.push(getMonthKey(monthDate));
  }

  const fiveYears = [];
  for (let index = 4; index >= 0; index -= 1) {
    fiveYears.push(String(now.getUTCFullYear() - index));
  }

  const dailySeries = buildSeries(sevenDays);
  const monthlySeries = buildSeries(twelveMonths);
  const yearlySeries = buildSeries(fiveYears);

  let totalPaidAmount = 0;
  let totalCommission = 0;
  let totalBookings = 0;
  let paidBookings = 0;
  let pendingBookings = 0;
  let failedBookings = 0;
  let cancelledBookings = 0;
  const cityBookingMap = new Map();
  const ownerSettlementMap = new Map();
  const recentTransactions = [];

  for (const booking of bookings) {
    const createdAt = toDate(booking.created_at) || new Date();
    if (filters.from && createdAt < filters.from) continue;
    if (filters.to && createdAt > filters.to) continue;
    if (filteredPropertyIds.size > 0 && !filteredPropertyIds.has(Number(booking.property_id)))
      continue;
    if (filteredProperties.length === 0 && (filters.city || filters.ownerId)) continue;

    totalBookings += 1;
    const paymentStatus = String(booking.payment_status || '').toLowerCase();
    const bookingStatus = String(booking.booking_status || '').toLowerCase();

    if (paymentStatus === 'paid') paidBookings += 1;
    if (paymentStatus === 'pending' || bookingStatus === 'pending') pendingBookings += 1;
    if (paymentStatus === 'failed' || bookingStatus === 'failed') failedBookings += 1;
    if (bookingStatus === 'cancelled') cancelledBookings += 1;

    const property = propertyById.get(Number(booking.property_id));
    const ownerId = Number(property?.owner_id);
    const paidAmount =
      Number(booking.rent_amount ?? booking.amount ?? booking.token_amount ?? 0) || 0;
    const bookingActive = !['cancelled', 'failed'].includes(bookingStatus);
    const commissionRate = 0;
    const commission = 0;

    if (bookingActive) {
      totalPaidAmount += paidAmount;
      totalCommission += commission;

      const city = String(property?.city || 'Unknown');
      const cityItem = cityBookingMap.get(city) || { city, paidBookings: 0, amount: 0 };
      cityItem.paidBookings += 1;
      cityItem.amount += paidAmount;
      cityBookingMap.set(city, cityItem);

      const ownerItem = ownerSettlementMap.get(ownerId) || {
        ownerId,
        paidBookings: 0,
        grossAmount: 0,
        commissionRate: 0,
        platformCommission: 0,
        payoutToOwner: 0,
      };
      ownerItem.paidBookings += 1;
      ownerItem.grossAmount += paidAmount;
      ownerItem.platformCommission += commission;
      ownerItem.payoutToOwner += paidAmount;
      ownerSettlementMap.set(ownerId, ownerItem);

      recentTransactions.push({
        bookingId: Number(booking.id),
        propertyId: Number(booking.property_id),
        propertyTitle: String(property?.title || '-'),
        ownerId,
        userId: Number(booking.user_id),
        city,
        amount: paidAmount,
        commissionRate: 0,
        commission: Number(commission.toFixed(2)),
        createdAt: createdAt.toISOString(),
      });
    }

    const dayKey = getDateKey(startOfDay(createdAt));
    const monthKey = getMonthKey(createdAt);
    const yearKey = getYearKey(createdAt);

    if (dailySeries.has(dayKey)) {
      const item = dailySeries.get(dayKey);
      item.bookings += 1;
      if (bookingActive) {
        item.paidBookings += 1;
        item.paidAmount += paidAmount;
        item.commission += commission;
      }
    }

    if (monthlySeries.has(monthKey)) {
      const item = monthlySeries.get(monthKey);
      item.bookings += 1;
      if (bookingActive) {
        item.paidBookings += 1;
        item.paidAmount += paidAmount;
        item.commission += commission;
      }
    }

    if (yearlySeries.has(yearKey)) {
      const item = yearlySeries.get(yearKey);
      item.bookings += 1;
      if (bookingActive) {
        item.paidBookings += 1;
        item.paidAmount += paidAmount;
        item.commission += commission;
      }
    }
  }

  recentTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const userCount = users.filter((user) => String(user.role || '').toLowerCase() === 'user').length;
  const ownerCountLegacy = users.filter(
    (user) => String(user.role || '').toLowerCase() === 'owner'
  ).length;
  const totalOwners = Math.max(Number(ownerCount || 0), Number(ownerCountLegacy || 0));

  const liveProperties = filteredProperties.filter((property) => {
    if (property.listing_status) return String(property.listing_status).toLowerCase() === 'live';
    return Boolean(property.is_approved);
  }).length;
  const underReviewProperties = Math.max(0, filteredProperties.length - liveProperties);

  const topCities = [...cityBookingMap.values()]
    .sort((a, b) => b.paidBookings - a.paidBookings)
    .slice(0, 8)
    .map((item) => ({ ...item, amount: Number(item.amount.toFixed(2)) }));

  const ownerSettlements = [...ownerSettlementMap.values()]
    .sort((a, b) => b.grossAmount - a.grossAmount)
    .map((item) => ({
      ...item,
      grossAmount: Number(item.grossAmount.toFixed(2)),
      platformCommission: Number(item.platformCommission.toFixed(2)),
      payoutToOwner: Number(item.payoutToOwner.toFixed(2)),
    }));

  const averageCommissionRate = 0;

  return {
    filters: {
      city: filters.city || null,
      ownerId: filters.ownerId || null,
      from: filters.from ? filters.from.toISOString() : null,
      to: filters.to ? filters.to.toISOString() : null,
    },
    totals: {
      users: userCount,
      owners: totalOwners,
      properties: filteredProperties.length,
      liveProperties,
      underReviewProperties,
      bookings: totalBookings,
      paidBookings,
      pendingBookings,
      failedBookings,
      cancelledBookings,
    },
    revenue: {
      totalPaidAmount: Number(totalPaidAmount.toFixed(2)),
      totalCommission: Number(totalCommission.toFixed(2)),
      averageCommissionRate: Number(averageCommissionRate.toFixed(2)),
      paymentsLogged: paymentsCount,
    },
    reports: {
      daily: [...dailySeries.values()].map((item) => ({
        ...item,
        paidAmount: Number(item.paidAmount.toFixed(2)),
        commission: Number(item.commission.toFixed(2)),
      })),
      monthly: [...monthlySeries.values()].map((item) => ({
        ...item,
        paidAmount: Number(item.paidAmount.toFixed(2)),
        commission: Number(item.commission.toFixed(2)),
      })),
      yearly: [...yearlySeries.values()].map((item) => ({
        ...item,
        paidAmount: Number(item.paidAmount.toFixed(2)),
        commission: Number(item.commission.toFixed(2)),
      })),
    },
    topCities,
    ownerSettlements,
    recentTransactions: recentTransactions.slice(0, 20),
  };
}

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const filters = normalizeFilters(searchParams);
    const result = await buildAdminOverview(filters);
    return Response.json(result);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return Response.json({ error: 'Failed to fetch admin overview' }, { status: 500 });
  }
}

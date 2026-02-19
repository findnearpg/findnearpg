import { buildAdminOverview } from '@/app/api/admin/overview/route';
import { requireRoles } from '@/app/api/utils/session';

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

function csvEscape(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n');
}

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const period = String(searchParams.get('period') || 'daily').toLowerCase();
    const filters = normalizeFilters(searchParams);
    const data = await buildAdminOverview(filters);

    let headers = [];
    let rows = [];
    let fileName = '';

    if (period === 'settlement') {
      headers = [
        'ownerId',
        'activeBookings',
        'grossRentValue',
        'platformCollection',
        'ownerCollection',
      ];
      rows = (data.ownerSettlements || []).map((item) => [
        item.ownerId,
        item.paidBookings,
        item.grossAmount,
        item.platformCommission,
        item.payoutToOwner,
      ]);
      fileName = 'admin-owner-collection-report.csv';
    } else {
      const series = data?.reports?.[period] || data?.reports?.daily || [];
      headers = ['period', 'bookings', 'activeBookings', 'rentValue', 'platformCollection'];
      rows = series.map((item) => [
        item.key,
        item.bookings,
        item.paidBookings,
        item.paidAmount,
        item.commission,
      ]);
      fileName = `admin-${period}-report.csv`;
    }

    const csv = rowsToCsv(headers, rows);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting admin overview csv:', error);
    return Response.json({ error: 'Failed to export csv' }, { status: 500 });
  }
}

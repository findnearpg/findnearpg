import sql from '@/utils/sql'

export async function POST(request) {
const { date } = await request.json();
  if (!date) {
    return Response.json({ error: "Date parameter is required in ISO format (YYYY-MM-DD)" });
  }

  try {
    const entries = await sql`
      SELECT id, date, time, text, created_at
      FROM entries
      WHERE date = ${date}
      ORDER BY time ASC
    `;

    return Response.json({ entries });
  } catch (error) {
    return Response.json({ error: "Failed to fetch entries", details: error.message });
  }
}

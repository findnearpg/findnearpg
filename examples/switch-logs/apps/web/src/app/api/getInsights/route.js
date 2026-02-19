import sql from '@/utils/sql'

export async function POST(request) {
  const { date } = await request.json();
  if (!date) {
    return Response.json({ error: "Date parameter is required in ISO format (YYYY-MM-DD)" });
  }

  try {
    const insights = await sql`
      SELECT id, date, prompt_snapshot, formatted_result, created_at
      FROM insights
      WHERE date = ${date}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (insights.length === 0) {
      return Response.json({ message: "No insights found for the specified date" });
    }

    return Response.json({ insight: insights[0] });
  } catch (error) {
    return Response.json({ error: "Failed to fetch insights", details: error.message });
  }
}

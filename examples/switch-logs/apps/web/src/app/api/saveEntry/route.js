import sql from '@/utils/sql'

export async function POST(request) {
  const { id, date, time, text } = await request.json();
  // Validate required parameters
  if (!date || !time || !text) {
    return Response.json({ error: "Date, time, and text are required parameters" });
  }

  try {
    let result;

    if (id) {
      // Update existing entry
      result = await sql`
        UPDATE entries 
        SET date = ${date}, time = ${time}, text = ${text}
        WHERE id = ${id}
        RETURNING id, date, time, text, created_at
      `;

      if (result.length === 0) {
        return Response.json({ error: "Entry not found" });
      }
    } else {
      // Create new entry
      result = await sql`
        INSERT INTO entries (date, time, text)
        VALUES (${date}, ${time}, ${text})
        RETURNING id, date, time, text, created_at
      `;
    }

    return Response.json({ entry: result[0] });
  } catch (error) {
    return Response.json({ error: "Failed to save entry", details: error.message });
  }
}

import sql from '@/utils/sql'

export async function POST(request) {
  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "Entry ID is required" });
  }

  try {
    const result = await sql`
      DELETE FROM entries
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: "Entry not found" });
    }

    return Response.json({ success: true, deletedId: result[0].id });
  } catch (error) {
    return Response.json({ error: "Failed to delete entry", details: error.message });
  }
}

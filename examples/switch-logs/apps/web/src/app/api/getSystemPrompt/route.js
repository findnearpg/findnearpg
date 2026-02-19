import sql from '@/utils/sql'

export async function POST() {
  try {
    const result = await sql`
      SELECT content 
      FROM system_prompts 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    if (result.length === 0) {
      return Response.json({ error: "No system prompt found" });
    }

    return Response.json({ prompt: result[0].content });
  } catch (error) {
    return Response.json({ error: "Failed to fetch system prompt", details: error.message });
  }
}

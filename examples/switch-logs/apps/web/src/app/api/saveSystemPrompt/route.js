import sql from '@/utils/sql'

export async function POST(request) {
  const { content } = await request.json();
  if (!content) {
    return Response.json({ error: "Content is required" });
  }

  try {
    const result = await sql`
      INSERT INTO system_prompts (content)
      VALUES (${content})
      RETURNING id, content, updated_at
    `;

    return Response.json({ prompt: result[0] });
  } catch (error) {
    return Response.json({ error: "Failed to save system prompt", details: error.message });
  }
}

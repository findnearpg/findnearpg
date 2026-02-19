import sql from '@/utils/sql'

export async function POST(request) {
const { date, prompt } = await request.json();
  if (!date) {
    return Response.json({ error: "Date parameter is required in ISO format (YYYY-MM-DD)" });
  }

  try {
    const entriesResult = await sql`
      SELECT id, date, time, text, created_at
      FROM entries
      WHERE date = ${date}
      ORDER BY time ASC
    `;

    if (entriesResult.length === 0) {
      return Response.json({ error: "No entries found for the specified date" });
    }

    let insightPrompt = prompt;
    if (!insightPrompt) {
      const promptResult = await sql`
        SELECT content 
        FROM system_prompts 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;

      if (promptResult.length > 0) {
        insightPrompt = promptResult[0].content;
      } else {
        insightPrompt =
          "Analyze the day's entries and provide insights on patterns, productivity, and suggestions for improvement.";
      }
    }

    const entriesText = entriesResult
      .map((entry) => `${entry.time.substring(0, 5)}: ${entry.text}`)
      .join("\n");

    const mockInsights = `
Daily Insights (${date}):

Key Patterns:
- You were most active in the morning hours
- Several task switches occurred between 2-4 PM
- You completed 3 major tasks today

Focus Areas:
- Project planning: 35% of your time
- Communication: 25% of your time
- Deep work: 40% of your time

Suggestions:
- Consider time-blocking your morning for deep work
- Your most productive period appears to be 10AM-12PM
- Try batching similar tasks together to reduce context switching
    `;

    const savedInsight = await sql`
      INSERT INTO insights (date, prompt_snapshot, formatted_result)
      VALUES (${date}, ${insightPrompt}, ${mockInsights})
      RETURNING id, date, formatted_result, created_at
    `;

    return Response.json({
      success: true,
      insight: savedInsight[0],
    });
  } catch (error) {
    return Response.json({ error: "Failed to generate insights", details: error.message });
  }
}

import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  const { slug } = params;

  try {
    const properties =
      await sql`SELECT * FROM properties WHERE slug = ${slug} AND is_approved = TRUE LIMIT 1`;

    if (properties.length === 0) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    return Response.json(properties[0]);
  } catch (error) {
    console.error("Error fetching property detail:", error);
    return Response.json(
      { error: "Failed to fetch property detail" },
      { status: 500 },
    );
  }
}

import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const area = searchParams.get("area");
  const gender = searchParams.get("gender");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = "SELECT * FROM properties WHERE is_approved = TRUE";
    const params = [];
    let paramIndex = 1;

    if (city) {
      query += ` AND city ILIKE $${paramIndex++}`;
      params.push(city);
    }
    if (area) {
      query += ` AND area ILIKE $${paramIndex++}`;
      params.push(area);
    }
    if (gender) {
      query += ` AND gender_allowed = $${paramIndex++}`;
      params.push(gender);
    }
    if (minPrice) {
      query += ` AND price >= $${paramIndex++}`;
      params.push(minPrice);
    }
    if (maxPrice) {
      query += ` AND price <= $${paramIndex++}`;
      params.push(maxPrice);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const properties = await sql(query, params);
    return Response.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return Response.json(
      { error: "Failed to fetch properties" },
      { status: 500 },
    );
  }
}

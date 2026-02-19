import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { userId, propertyId, roomType, amount } = await request.json();

    if (!userId || !propertyId || !amount) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO bookings (user_id, property_id, room_type, amount, payment_status, booking_status)
      VALUES (${userId}, ${propertyId}, ${roomType}, ${amount}, 'pending', 'pending')
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating booking:", error);
    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}

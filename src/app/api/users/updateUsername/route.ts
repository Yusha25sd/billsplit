import { NextRequest, NextResponse } from "next/server";
import { dbConnect, getSqlClient } from "@/lib/database";

export async function PUT(req: NextRequest) {
  const { username, userId } = await req.json();

  if (!username) {
    return NextResponse.json(
      { success: false, message: "Username is required" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const sql = getSqlClient();

    await sql`
      UPDATE users
      SET username = ${username}
      WHERE user_id = ${userId};
    `;

    return NextResponse.json({ success: true, message: "Username updated successfully." });
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update username." },
      { status: 500 }
    );
  }
}

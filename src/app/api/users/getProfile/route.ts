import { NextRequest, NextResponse } from "next/server";
import { dbConnect, getSqlClient } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const sql = getSqlClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId'); 
    
    const user = await sql`
      SELECT 
        username, 
        email, 
        created_at AS "joiningDate"
      FROM users
      WHERE user_id = ${userId};
    `;

    // Fetch monthly expenses
    const totalExpenses = await sql`
      SELECT 
        TO_CHAR(e.date, 'YYYY-MM') AS "month",
        SUM(es.balance) AS "monthlyExpense"
      FROM expenses e
      INNER JOIN expense_splits es
      ON es.expense_id = e.expense_id
      WHERE es.user_id = ${userId} AND is_deleted = false
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY "month" DESC;
    `;

    return NextResponse.json({
      user: user[0],
      totalExpenses,
    });
  } catch (error) {
    console.error("Error fetching profile settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile settings." },
      { status: 500 }
    );
  }
}

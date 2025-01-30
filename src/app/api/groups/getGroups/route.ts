import { dbConnect, getSqlClient } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  // Validate input parameters
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'User ID is required to fetch group details.' },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    await dbConnect();
    const sql = getSqlClient();

    // Fetch group details directly using the updated schema
    const groups = await sql`
      SELECT 
        g.group_id AS "groupId",
        g.name,
        g.created_at AS "createdAt",
        g.group_expense AS "groupExpense",
        SUM(gb.balance) AS "userBalance"
      FROM groups g
      LEFT JOIN group_balances gb ON g.group_id = gb.group_id
      WHERE gb.user_id = ${userId}
      GROUP BY g.group_id, g.name, g.created_at, g.group_expense
    `;
    return NextResponse.json(
      { success: true, groups },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching group details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch group details.' },
      { status: 500 }
    );
  }
}

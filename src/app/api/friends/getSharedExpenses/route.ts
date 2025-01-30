import { dbConnect, getSqlClient } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const friendId = searchParams.get('friendId');

  if (!userId || !friendId) {
    return NextResponse.json(
      { success: false, message: 'User ID and Friend ID are required.' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const sql = getSqlClient();

    // Fetch friend's details
    const friendDetails = await sql`
      SELECT 
        u.user_id AS "friendId",
        u.username AS "friendName",
        u.email AS "friendEmail",
        fb.balance
      FROM users u
      INNER JOIN friend_balances fb ON fb.friend_id = u.user_id
      WHERE u.user_id = ${friendId};
    `;

    if (!friendDetails || friendDetails.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Friend not found.' },
        { status: 404 }
      );
    }

    const friend = friendDetails[0];

    // Fetch group-wise shared expenses
    const groupExpenses = await sql`
      SELECT 
        g.group_id AS "groupId",
        g.name AS "groupName",
        COALESCE(gb.balance, 0) AS "sharedBalance"
      FROM groups g
      LEFT JOIN group_balances gb ON g.group_id = gb.group_id
      WHERE gb.user_id = ${userId} AND gb.member_id = ${friendId};
    `;

    // Fetch non-group shared expenses
    const expenseIds = await sql`
      SELECT DISTINCT e.expense_id
      FROM expenses e
      JOIN expense_splits es1 ON e.expense_id = es1.expense_id AND es1.user_id = ${userId}
      JOIN expense_splits es2 ON e.expense_id = es2.expense_id AND es2.user_id = ${friendId}
      WHERE e.is_deleted = FALSE AND e.group_id IS NULL;
    `;

    const nonGroupExpenses = await Promise.all(
      expenseIds.map(async (expense: { expense_id: string }) => {
        const [details] = await sql`
          SELECT 
            e.expense_id AS "expenseId",
            e.description,
            e.amount,
            e.date,
            e.is_deleted AS "isDeleted",
            COALESCE(es.balance, 0) AS "userBalance"
          FROM expenses e
          JOIN expense_splits es ON e.expense_id = es.expense_id AND es.user_id = ${userId}
          WHERE e.expense_id = ${expense.expense_id};
        `;
        return details;
      })
    );

    // Construct response
    const sharedActivity = {
      friend: {
        friendId: friend.friendId,
        friendName: friend.friendName,
        friendEmail: friend.friendEmail,
        balance: friend.balance || 0,
      },
      groupExpenses: groupExpenses || [],
      nonGroupExpenses: nonGroupExpenses || [],
    };

    return NextResponse.json(
      { success: true, sharedActivity },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching shared activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shared activity.' },
      { status: 500 }
    );
  }
}


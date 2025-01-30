import { dbConnect, getSqlClient } from '@/lib/database';
import { FriendBalance } from '@/schemas/friend';
import { ExpenseSplit } from '@/schemas/expense';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();
    const sql = getSqlClient();

    const friendBalances: FriendBalance[] = await sql<FriendBalance[]>`
      SELECT 
        fb.friend_id AS "friendId", 
        fb.balance, 
        u.username AS "friendName", 
        u.email AS "friendEmail" 
      FROM friend_balances fb
      JOIN users u ON fb.friend_id = u.user_id
      WHERE fb.user_id = ${userId};
    `;

    const expenses = await sql`
      SELECT balance
      FROM friend_balances
      WHERE user_id = ${userId}
    `;

    const totalBalance = expenses.reduce((sum: number, expense: ExpenseSplit) => sum + Number(expense.balance),0);

    return NextResponse.json({ success: true, friendBalances, totalBalance }, { status: 200 });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch friends.' },
      { status: 500 }
    );
  }
}

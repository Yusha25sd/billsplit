import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getSqlClient } from '@/lib/database';
import { GroupBalances } from '@/schemas/group';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');
    const friendId = searchParams.get('friendId');
    if (!userId || (!groupId && !friendId)) {
      return NextResponse.json(
        { success: false, message: 'Query parameters "userId" and either "groupId" or "friendId" are required.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const sql = getSqlClient();

    let results;

    // If friendId is provided, fetch the amount owed to the friend
    if (friendId!=="null") {
      results = await sql`
        SELECT
          fb.friend_id AS "memberId",
          u.username AS "name",
          u.email,
          fb.balance
        FROM friend_balances fb
        INNER JOIN users u ON fb.friend_id = u.user_id
        WHERE fb.user_id = ${userId} AND fb.friend_id = ${friendId};
      `;
    }

    // If groupId is provided, fetch the amounts owed to each group member
    if (groupId!=="null") {
      results = await sql`
        SELECT
          gb.member_id AS "memberId",
          u.username AS "name",
          u.email,
          gb.balance
        FROM group_balances gb
        INNER JOIN users u ON gb.member_id = u.user_id
        WHERE gb.group_id = ${groupId} AND gb.user_id = ${userId};
      `;
    }

    // Map the results to a user-friendly format
    const response = results.map((row: GroupBalances & {name: string, email: string}) => ({
      memberId: row.memberId,
      name: row.name,
      email: row.email,
      balance: row.balance,
    }));
    return NextResponse.json({success: true, data: response || []}, { status: 200 });
  } catch (error) {
    console.error('Error in settle-up fetch API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

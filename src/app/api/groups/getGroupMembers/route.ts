import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getSqlClient } from '@/lib/database';
import { UserProfile } from '@/schemas/user';

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    // Validate query parameters
    if (!groupId) {
      return NextResponse.json({ message: 'Query parameter groupId is required' }, { status: 400 });
    }

    await dbConnect();
    const sql = getSqlClient();

    // Query to get group members based on the groupId
    const result = await sql`
      SELECT u.user_id AS "userId", u.username, u.email
      FROM users u
      INNER JOIN group_balances gb ON u.user_id = gb.user_id
      WHERE gb.group_id = ${groupId}
      LIMIT 100;  -- You can adjust the limit as necessary
    `;

    // Map the result to a more usable format
    const members = result.map((row: UserProfile) => ({
      userId: row.userId,
      username: row.username,
      email: row.email,
    }));
    console.log(members);
    return NextResponse.json({ success: true, data: members }, { status: 200 });
  } catch (error) {
    console.error('Error in getGroupMembers API:', error);
    return NextResponse.json({ message: 'Internal server error. Please try again later.' }, { status: 500 });
  }
}

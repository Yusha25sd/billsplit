import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getSqlClient } from '@/lib/database';
import { UserProfile } from '@/schemas/user';

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const groupId = searchParams.get('groupId');

    // Validate query parameters
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ message: 'Query parameter "name" is required and must be a string.' }, { status: 400 });
    }


    await dbConnect();
    const sql = getSqlClient();
    const result = (groupId !== "null" && groupId !== null)
      ? await sql`
          SELECT u.user_id, u.username, u.email
          FROM users u
          INNER JOIN group_balances gb ON u.user_id = gb.user_id
          WHERE gb.group_id = ${groupId}
            AND (u.username ILIKE ${name + '%'} OR u.email ILIKE ${name + '%'})
          LIMIT 10;
        `
      : await sql`
          SELECT user_id, username, email
          FROM users
          WHERE username ILIKE ${name + '%'} OR email ILIKE ${name + '%'}
          LIMIT 10;
        `;

    // Map the result to a more usable format
    const users = result.map((row: UserProfile) => ({
      userId: row.userId,
      username: row.username,
      email: row.email,
    }));

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ message: 'Internal server error. Please try again later.' }, { status: 500 });
  }
}

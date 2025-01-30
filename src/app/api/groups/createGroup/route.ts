import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getSqlClient } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { name, members } = await req.json();

    if (!name || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Group name and members are required.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const sql = getSqlClient();

    // Insert the group and return the ID
    const groupResult = await sql`
      INSERT INTO groups (name)
      VALUES (${name})
      RETURNING group_id;
    `;

    const groupId = groupResult[0]?.group_id;
    if (!groupId) {
      throw new Error('Failed to create group.');
    }

    // Insert user_id and member_id combinations into the database
    for (const userId of members) {
      for (const memberId of members) {
        if (userId !== memberId) {
          await sql`
            INSERT INTO group_balances (group_id, user_id, member_id)
            VALUES (${groupId}, ${userId}, ${memberId})
            ON CONFLICT (group_id, user_id, member_id) DO NOTHING;
          `;
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'Group created successfully.', data: groupId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create group. Please try again later.' },
      { status: 500 }
    );
  }
}

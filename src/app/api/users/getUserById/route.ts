import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react'; // NextAuth function to get session
import { dbConnect,getSqlClient } from '@/lib/database'; // Import your database connection logic

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    const sql = getSqlClient(); // Get SQL client or use your ORM query method

    // Fetch user by userId
    const result = await sql`
      SELECT user_id, username, email
      FROM users
      WHERE user_id = ${userId}
      LIMIT 1;
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result[0];
    return NextResponse.json({
      userId: user.user_id,
      username: user.username,
      email: user.email,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return NextResponse.json({ message: 'Internal server error. Please try again later.' }, { status: 500 });
  }
}

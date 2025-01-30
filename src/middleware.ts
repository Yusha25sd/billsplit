import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { dbConnect, getSqlClient } from '@/lib/database';

export async function middleware(req: NextRequest) {
  try {
    await dbConnect();
    // Get authentication token (works for API & page routes)
    const token = await getToken({ req });

    // If no session/token exists, redirect to login page
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const sql = getSqlClient();
    const url = new URL(req.url);
    const expenseId = url.searchParams.get('expenseId'); // Extracting from query params

    // If no expenseId, redirect back to dashboard
    if (!expenseId) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Fetch expense details (including groupId)
    const expense = await sql`
      SELECT user_id AS "userId", group_id AS "groupId" FROM expenses WHERE expense_id = ${expenseId};
    `;

    if (expense.length === 0) {
      return NextResponse.redirect(new URL('/dashboard', req.url)); // Expense doesn't exist
    }

    const { userId, groupId } = expense[0];

    // If the expense is part of a group, check if the user is in the group
    if (groupId) {
      const groupCheck = await sql`
        SELECT * FROM group_balances WHERE group_id = ${groupId} AND user_id = ${token.sub};
      `;
      if (groupCheck.length === 0) {
        return NextResponse.redirect(new URL('/dashboard', req.url)); // Not a member, redirect
      }
    }

    const expenseCheck = await sql`
      SELECT * FROM expense_splits WHERE expense_id = ${expenseId} AND user_id = ${token.sub};
    `;
    if ( userId !== token.sub && expenseCheck.length === 0 ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If everything is fine, proceed with the request
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware Error:', error);
    return NextResponse.redirect(new URL('/error', req.url));
  }
}
export const config = {
  matcher: ['/api/expenses/delete'],
};

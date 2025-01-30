import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getSqlClient } from '@/lib/database';
import { Expense } from '@/schemas/expense';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { message: 'Query parameter "userId" is required and must be a string.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const sql = getSqlClient();

    // Fetch all expenses the user is part of, including precomputed balance
    const expenses = await sql<Expense[]>`
      SELECT 
        e.expense_id AS "expenseId", 
        e.description, 
        CAST(e.amount AS NUMERIC) AS "amount", 
        e.date, 
        e.is_deleted AS "isDeleted",
        es.balance AS "balance" 
      FROM expenses e
      INNER JOIN expense_splits es ON e.expense_id = es.expense_id
      WHERE es.user_id = ${userId}
      ORDER BY e.date DESC; 
    `;

    return NextResponse.json({ success: true, data: expenses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user expenses:', error);
    return NextResponse.json({ message: 'Failed to fetch user expenses.' }, { status: 500 });
  }
}

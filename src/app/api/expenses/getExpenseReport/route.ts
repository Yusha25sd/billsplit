import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getSqlClient } from '@/lib/database';
import { Expense, ExpenseSplit } from '@/schemas/expense';
import { UserSearchResult } from '@/schemas/user';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('expenseId');
    
    if (!expenseId) {
      return NextResponse.json(
        { message: 'Query parameter "expenseId" is required.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const sql = getSqlClient();

    // Fetch expense details
    const [expense] = await sql<Expense[]>`
      SELECT expense_id AS "expenseId", user_id AS "userId", amount, description, date, group_id AS "groupId", is_deleted AS "isDeleted"
      FROM expenses
      WHERE expense_id = ${expenseId};
    `;

    if (!expense) {
      return NextResponse.json({ message: 'Expense not found.' }, { status: 404 });
    }

    // Fetch participants and splits with balance
    const splits = await sql<ExpenseSplit[]>`
      SELECT 
        expense_id AS "expenseId", 
        user_id AS "userId", 
        amount_paid AS "amountPaid", 
        amount_owed AS "amountOwed", 
        balance 
      FROM expense_splits
      WHERE expense_id = ${expenseId};
    `;

    const userIds = splits.map((split: ExpenseSplit) => split.userId);

    // Fetch user details
    const users = await sql`
      SELECT user_id AS "userId", username, email
      FROM users
      WHERE user_id = ANY(${userIds});
    `;

    // Attach user details to splits
    const splitsWithUsers = splits.map((split: ExpenseSplit) => {
      const user = users.find((u: UserSearchResult) => u.userId === split.userId);
      return {
        ...split,
        username: user?.username,
        email: user?.email,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          expense,
          participants: splitsWithUsers,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expense report:', error);
    return NextResponse.json({ message: 'Failed to fetch expense report.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSqlClient, dbConnect } from '@/lib/database';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { expenseId } = await req.json();

    if (!expenseId) {
      return NextResponse.json({ success: false, message: 'Expense not found.' }, { status: 400 });
    }

    const sql = getSqlClient();

    // Get the expense details, including the amount
    const expenseResult = await sql`
      SELECT amount, group_id
      FROM expenses 
      WHERE expense_id = ${expenseId};
    `;
    const groupId = expenseResult[0].group_id;

    if (expenseResult.length === 0) {
      return NextResponse.json({ success: false, message: 'Expense not found.' }, { status: 404 });
    }

    const expenseAmount = expenseResult[0].amount;

    // Mark the expense as deleted
    const result = await sql`
      UPDATE expenses
      SET is_deleted = true
      WHERE expense_id = ${expenseId};
    `;

    if (result.count === 0) {
      return NextResponse.json({ success: false, message: 'Expense not found or not authorized to delete.' }, { status: 404 });
    }

    // Adjust the group expense balance if groupId is provided
    if (groupId) {
      const groupExpenseUpdate = await sql`
        UPDATE groups
        SET group_expense = group_expense - ${expenseAmount}
        WHERE group_id = ${groupId};
      `;

      if (groupExpenseUpdate.count === 0) {
        return NextResponse.json({ success: false, message: 'Group not found or invalid.' }, { status: 404 });
      }
    }

    // Adjust the balances for the individual expense splits
    await sql`
      UPDATE expense_splits
      SET balance = -1 * balance
      WHERE expense_id = ${expenseId};
    `;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const addBalance = await axios.post(`${baseUrl}/api/expenses/addBalance`, { expenseId });

    if (!addBalance.data.success) {
      return NextResponse.json({ success: false, message: 'Failed to delete the old balance.' }, { status: 500 });
    }

    await sql`
    UPDATE expense_splits
    SET balance = -1 * balance
    WHERE expense_id = ${expenseId};
  `;
  
    return NextResponse.json({ success: true, message: 'Expense marked as deleted and group expenses updated.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete expense.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSqlClient, dbConnect } from '@/lib/database';
import { Expense, ExpenseSplit } from '@/schemas/expense';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { expenseId, amount, description, groupId, splits, userId, date } = await req.json();
    if (!amount || !description || (groupId && !splits)) {
      return NextResponse.json({ success: false, message: 'Invalid request data.' }, { status: 400 });
    }
    const group_id = (groupId === "null" || groupId === null) ? null : groupId;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const sql = getSqlClient();

    // Validate splits to ensure they match the total amount
    const totalOwed = splits.reduce((sum: number, split: ExpenseSplit) => sum + split.amountOwed, 0);
    const tolerance = 0.01; // 1 cent tolerance
    if (Math.abs(totalOwed - amount) > tolerance) {
      return NextResponse.json({
        success: false,
        message: `Owed amounts do not match the total expense. Expected: ${amount}, Received: ${totalOwed}`,
      }, { status: 400 });
    }

    const totalPaid = splits.reduce((sum: number, split: ExpenseSplit) => sum + split.amountPaid, 0);
    if (Math.abs(totalPaid - amount) > tolerance) {
      return NextResponse.json({
        success: false,
        message: `Paid amounts do not match the total expense. Expected: ${amount}, Received: ${totalPaid}`,
      }, { status: 400 });
    }

    // Set the default date to the current date if not provided
    const expenseDate = date || new Date().toISOString(); // ISO 8601 format

    if (expenseId) {
      // Mark the old expense as deleted
    const updateBalance = await axios.post(`${baseUrl}/api/expenses/deleteExpense`,{expenseId, groupId}
    ); 

    if(!updateBalance.data.success){ 
      return NextResponse.json({ success: false, message: 'Failed to delete the old balance.' }, { status: 500 });
    }

    }
      // Insert a new expense with the updated data
      const [expense] = await sql<Expense[]>`
        INSERT INTO expenses (amount, description, group_id, user_id, date)
        VALUES (${amount}, ${description}, ${group_id}, ${userId}, ${expenseDate})
        RETURNING expense_id;
      `;
      const newExpenseId = expense.expense_id;
      
      // Insert new splits with balances
      const insertPromises = splits.map(({ userId, amountPaid, amountOwed }: ExpenseSplit) => {
        const balance = amountPaid - amountOwed;
        return sql`
          INSERT INTO expense_splits (expense_id, user_id, amount_paid, amount_owed, balance)
          VALUES (${newExpenseId}, ${userId}, ${amountPaid}, ${amountOwed}, ${balance});
        `;
      });
      
      if(group_id)
      {
        await sql`
        UPDATE groups
        SET group_expense = group_expense + ${amount}
        WHERE group_id = ${group_id};
        `;
      }
      await Promise.all(insertPromises);
      const addBalance = await axios.post(`${baseUrl}/api/expenses/addBalance`, { expenseId: newExpenseId });

    if (!addBalance.data.success) {
      return NextResponse.json({ success: false, message: 'Failed to add balance.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: 'Expense added successfully.', newExpenseId }, { status: 200 });
  
  } catch (error) {
    console.error('Error adding/updating expense:', error);
    return NextResponse.json({ success: false, message: 'Failed to add/update expense.' }, { status: 500 });
  }
}

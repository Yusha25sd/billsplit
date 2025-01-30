import { dbConnect, getSqlClient } from '@/lib/database';
import { Expense, ExpenseSplit } from '@/schemas/expense';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const userId = searchParams.get('userId');

  // Validate input parameters
  if (!groupId) {
    return NextResponse.json(
      { success: false, message: 'Group ID is required to fetch report.' },
      { status: 400 }
    );
  }
  try {
    // Connect to the database
    await dbConnect();
    const sql = getSqlClient();

    // Fetch group details
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await axios.get(`${baseUrl}/api/groups/getGroups?userId=${userId}`);
    const groupDetails = response.data.groups;

    if (groupDetails.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Group not found.' },
        { status: 404 }
      );
    }

    const group = groupDetails[0];

    // Fetch user balances along with names and emails in the group
    const balances = await sql`
    SELECT 
      gb.user_id AS "userId",
      gb.balance AS "balance",
      gb.member_id AS "memberId",
      u.username AS "name",
      u.email AS "email"
    FROM group_balances gb
    JOIN users u ON gb.member_id = u.user_id
    WHERE gb.group_id = ${groupId};
    `;


    // Fetch expenses and splits
    const expenses = await sql`
      SELECT 
        expense_id AS "expenseId",
        description,
        date,
        amount,
        is_deleted AS "isDeleted"
      FROM expenses
      WHERE group_id = ${groupId}
      ORDER BY date DESC
    `;

    const splits = (await Promise.all(
      expenses.map((expense: Expense) =>
        sql`
          SELECT 
            expense_id AS "expenseId",
            user_id AS "userId",
            balance
          FROM expense_splits
          WHERE expense_id = ${expense.expenseId}
        `
      )
    )).flat();    
    
    // Map splits to respective expenses
    const expensesWithSplits = expenses.map((expense: Expense) => ({
      expense,
      splits: splits.filter((split: ExpenseSplit) => split.expenseId === expense.expenseId),
    }));

    // Construct the group report
    const groupReport = {
      group,
      balances,
      expenses: expensesWithSplits,
    };

    return NextResponse.json(
      { success: true, groupReport },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching group report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch group report.' },
      { status: 500 }
    );
  }
}
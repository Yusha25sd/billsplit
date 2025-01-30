import { dbConnect, getSqlClient } from "@/lib/database";
import { ExpenseSplit } from "@/schemas/expense";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { expenseId } = await req.json();
    
    if (!expenseId) {
        return NextResponse.json(
            { success: false, message: "Expense ID is required" },
            { status: 400 }
        );
    }

    try {
        // Connect to the database
        await dbConnect();
        const sql = getSqlClient();
        
        // Retrieve creditors and debtors for the given expense
        const group = await sql`
            SELECT group_id
            FROM expenses
            WHERE expense_id = ${expenseId}
        `;
        
        const creditors = await sql`
            SELECT balance, user_id
            FROM expense_splits
            WHERE expense_id = ${expenseId} AND balance > 0;
        `;

        const debtors = await sql`
            SELECT balance, user_id
            FROM expense_splits
            WHERE expense_id = ${expenseId} AND balance < 0;
        `;

        if (creditors.length === 0 || debtors.length === 0) {
            return NextResponse.json(
                { success: false, message: "No creditors or debtors found for this expense" },
                { status: 400 }
            );
        }

        // Calculate the total owed amount (sum of debtor balances)
        const totalOwed = debtors.reduce((sum: number, split: ExpenseSplit) => sum + split.balance).balance;

        for (const debtor of debtors) {
            const debtorId = debtor.user_id;

            for (const creditor of creditors) {
                const creditorId = creditor.user_id;
                const balance = (debtor.balance * creditor.balance) / totalOwed;
                
                // Update debtor-to-creditor balance
                await sql`
                    INSERT INTO friend_balances (user_id, friend_id, balance)
                    VALUES (${debtorId}, ${creditorId}, -1*${balance})
                    ON CONFLICT (user_id, friend_id)
                    DO UPDATE SET balance = friend_balances.balance - ${balance};
                `;

                // Update creditor-to-debtor balance
                await sql`
                    INSERT INTO friend_balances (user_id, friend_id, balance)
                    VALUES (${creditorId}, ${debtorId}, ${balance})
                    ON CONFLICT (user_id, friend_id)
                    DO UPDATE SET balance = friend_balances.balance + ${balance};
                `; 
                
                const groupId = group[0].group_id;
                if(groupId)
                {   
                    await sql`
                        UPDATE group_balances 
                        SET balance = balance - ${balance}
                        WHERE user_id = ${debtorId} AND member_id = ${creditorId} AND group_id = ${groupId};
                    `;

                    // Update creditor-to-debtor balance
                    await sql`
                        UPDATE group_balances 
                        SET balance = balance + ${balance}
                        WHERE user_id = ${creditorId} AND member_id = ${debtorId} AND group_id = ${groupId};
                    `; 
                }
            }
        }

        return NextResponse.json(
            { success: true, message: "Balances successfully distributed" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in balance distribution:", error);
        return NextResponse.json({ success: false, message: 'Failed to add expense in friend balance.' }, { status: 500 });
    }
}

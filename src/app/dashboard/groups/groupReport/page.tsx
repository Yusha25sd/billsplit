'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Expense, ExpenseSplit } from '@/schemas/expense';
import { Groups } from '@/schemas/group';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface GroupReport {
  group: ( Groups & {userBalance: number});
  balances:{
    userId: string;
    balance: number; 
    memberId: string; 
    name: string; 
    email: string; 
  }[]
  expenses: {
    expense: Expense;
    splits: ExpenseSplit[];
  }[];
}

export default function GroupReportPage() {
  const [groupReport, setGroupReport] = useState<GroupReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const userId = session?.user.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchGroupReport = async () => {
      try {
        const res = await axios.get(`/api/groups/groupReport?groupId=${groupId}&userId=${userId}`);
        const data = res.data;
        if (data.success) {
          setGroupReport(data.groupReport);
        }
      } catch (err) {
        console.error('Failed to fetch group report:', err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) fetchGroupReport();
  }, [groupId, status, router]);

  if (loading) return <div>Loading...</div>;
  if (!groupReport) return <div>Group report not available.</div>;

  const { group, balances, expenses } = groupReport;

  const owesYou = balances.filter((b) => b.userId !== session?.user?.id && b.balance < 0);
  const youOwe = balances.filter((b) => b.userId !== session?.user?.id && b.balance > 0);
  

  return (
    <div className="text-teal-700 bg-gray-50 container mx-auto p-4">
      {/* Group Information */}
      <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-teal-800 text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Created At: {format(new Date(group.createdAt), "do MMMM yyyy")}
        </p>
        {group.groupExpense > 0 ? (
          <p className="text-lg font-medium mt-2">
            Total Group Expense: ₹{group.groupExpense}
          </p>
        ) : (
          <p className="text-lg font-medium mt-2">No expenses have been made</p>
        )}
      </div>

      <div>
        {group.userBalance > 0 ? (
          <p className="text-lg font-medium mt-2 text-green-500">
            You are owed: ₹{group.userBalance}
          </p>
        ) : group.userBalance < 0 ? (
          <p className="text-lg font-medium mt-2 text-red-500">
            You owe: ₹{Math.abs(group.userBalance)}
          </p>
        ) : (
          <p className="text-lg font-medium mt-2 text-gray-500">
            You are settled
          </p>
        )}

        <Link href={`/dashboard/settleUp?userId=${userId}&groupId=${groupId}`}>
          <Button className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg">Settle Up</Button>
        </Link>
      </div>
    </div>


      {/* User Balance Overview */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
          {/* Owes You */}
          <div className="flex flex-col min-h-full">
            <h2 className="text-xl font-semibold mb-4">Owes You</h2>
            <ul className="space-y-2 flex-grow">
              {owesYou.length > 0 ? (
                owesYou.map((member) => (
                  <li
                    key={member.memberId}
                    className="flex justify-between border p-2 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-green-500">₹{Math.abs(member.balance)}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No one owes you money.</p>
              )}
            </ul>
          </div>

          {/* You Owe */}
          <div className="flex flex-col min-h-full">
            <h2 className="text-xl font-semibold mb-4">You Owe</h2>
            <ul className="space-y-2 flex-grow">
              {youOwe.length > 0 ? (
                youOwe.map((member) => (
                  <li
                    key={member.memberId}
                    className="flex justify-between border p-2 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-red-500">₹{Math.abs(member.balance)}</span>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">You do not owe anyone money.</p>
              )}
            </ul>
          </div>
        </div>
      </div>



      {/* Expense History */}
      <div>
        <h2 className="text-teal-800 text-xl font-semibold mb-4">Expense History</h2>
        <ul className="space-y-4">
          {expenses.length > 0 ? (
            expenses.map(({ expense, splits }) => {
              const userSplit = splits.find((s) => s.userId === userId); // Get current user's split
              return (
                <Card
                  key={expense.expenseId}
                  className="p-4 border rounded-md shadow-md"
                  onClick={() =>
                    router.push(`/dashboard/activity/expenseReport?expenseId=${expense.expenseId}`)
                  }
                >
                  <div className="mb-2 flex justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{expense.description}</h3>
                      <p className="text-sm text-gray-600">
                        Amount: ₹{expense.amount} | Date: {format(new Date(expense.date), "dd/MM/yyyy, hh:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      {userSplit ? (
                        <p
                          className={`text-base ${
                            userSplit.balance < 0
                              ? "text-red-500"
                              : userSplit.balance > 0
                              ? "text-green-500"
                              : "text-gray-500"
                          }`}
                        >
                          {userSplit.balance > 0
                            ? `You are owed: ₹${userSplit.balance}`
                            : userSplit.balance < 0
                            ? `You owe: ₹${Math.abs(userSplit.balance)}`
                            : "You are settled"}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">You are not involved</p>
                      )}
                    </div>
                  </div>
                  {expense.isDeleted && (
                    <p className="text-xs text-gray-500">This expense has been deleted.</p>
                  )}
                </Card>
              );
            })
          ) : (
            <p className="text-gray-500">No expenses recorded for this group.</p>
          )}
        </ul>
      </div>

    </div>
  );
}

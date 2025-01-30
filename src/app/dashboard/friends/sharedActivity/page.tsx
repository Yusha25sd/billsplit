'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Use useSearchParams for App Router
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Expense } from '@/schemas/expense';

type SharedActivity = {
  friend: {
    friendId: string;
    friendName: string;
    friendEmail: string;
    balance: number;
  };
  groupExpenses: {
    groupId: string;
    groupName: string;
    sharedBalance: number;
  }[];
  nonGroupExpenses: (Expense &({userBalance: number}))[];
};

const SharedActivityPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendId = searchParams.get('friendId');
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [sharedActivity, setSharedActivity] = useState<SharedActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!friendId || !userId) return;

    const fetchSharedActivity = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/friends/getSharedExpenses?userId=${userId}&friendId=${friendId}`);
        const data = await response.json();

        if (response.ok) {
          setSharedActivity(data.sharedActivity);
        } else {
          setError(data.message || 'Failed to fetch shared activity.');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedActivity();
  }, [friendId, userId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!sharedActivity) {
    return <p>No shared activity found.</p>;
  }

  const { friend, groupExpenses, nonGroupExpenses } = sharedActivity;

  return (
    <div className="p-4 text-teal-700">
      {/* Friend Details */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-teal-800 text-2xl font-bold">{friend.friendName}</h2>
          <p className="text-gray-500">{friend.friendEmail}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${friend.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {friend.balance > 0
              ? `Owes you ₹${friend.balance}`
              : friend.balance < 0
              ? `You owe ₹${Math.abs(friend.balance)}`
              : 'You are settled'}
          </p>
          <Link href={`/dashboard/settleUp?userId=${userId}&friendId=${friendId}`}>
            <Button className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg">Settle Up</Button>
          </Link>
        </div>
      </div>

      {/* Group Shared Expenses */}
      <div className="mb-6">
        <h3 className="text-teal-800 text-xl font-semibold mb-4">Group Shared Expenses</h3>
        {groupExpenses.length > 0 ? (
          <ul className="space-y-4">
            {groupExpenses.map((group) => (
              <Card
                key={group.groupId}
                className="p-4 border rounded-md shadow-md"
                onClick={() => router.push(`/dashboard/groups/groupReport?groupId=${group.groupId}`)}
              >
                <div className="mb-2 flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{group.groupName}</h3>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base ${
                        group.sharedBalance > 0 ? "text-green-500" 
                        : group.sharedBalance < 0
                        ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {group.sharedBalance > 0
                        ? `Owes you ₹${group.sharedBalance}`
                        : group.sharedBalance < 0 
                        ? `You owe ₹${Math.abs(group.sharedBalance)}`
                        :'You are settled'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No shared group expenses.</p>
        )}
      </div>


      {/* Non-Group Shared Expenses */}
      <div>
        <h3 className="text-teal-800 text-xl font-semibold mb-4">Non-Group Shared Expenses</h3>
        <ul className="space-y-4">
          {nonGroupExpenses.length > 0 ? (
            nonGroupExpenses.map((expense) => (
              <Card
                key={expense.expenseId}
                className="p-4 border rounded-md shadow-md"
                onClick={() => router.push(`/dashboard/activity/expenseReport?expenseId=${expense.expenseId}`)}
              >
                <div className="mb-2 flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{expense.description}</h3>
                    <p className="text-sm text-gray-600">
                      Amount: ₹{expense.amount} | Date: {format(new Date(expense.date), "dd/MM/yyyy, hh:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base ${
                        expense.userBalance > 0
                          ? "text-green-500"
                          : expense.userBalance < 0
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {expense.userBalance > 0
                        ? `You are owed: ₹${expense.userBalance}`
                        : expense.userBalance < 0
                        ? `You owe: ₹${Math.abs(expense.userBalance)}`
                        : "You are settled"}
                    </p>
                  </div>
                </div>
                {expense.isDeleted && <p className="text-xs text-gray-500">This expense has been deleted.</p>}
              </Card>
            ))
          ) : (
            <p className="text-gray-500">No shared non-group expenses.</p>
          )}
        </ul>
      </div>

    </div>
  );
};

export default SharedActivityPage;

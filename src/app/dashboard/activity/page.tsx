'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { Expense } from '@/schemas/expense';

interface UserExpense extends Expense{
  balance: number;
}

export default function ActivityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<UserExpense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUserExpenses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/users/getActivity?userId=${session.user.id}`);
        const data = res.data;
        if (data.success) {
          setExpenses(data.data);
        } else {
          toast({ title: 'Error', description: data.message, variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch expenses.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserExpenses();
  }, [session]);

  if (loading) return <div className="text-teal-700 flex justify-center items-center h-full">Loading...</div>;

  if (expenses.length === 0)
    return <div className="text-center text-gray-500 mt-8">No expenses found.</div>;

  return (
    <div className="text-teal-700 container mx-auto p-4">
      <h2 className="text-teal-800 text-2xl font-bold mb-4">Activity</h2>
      <div className="grid grid-cols-1 gap-4">
  {expenses.map((expense: UserExpense) => (
    <Card
      key={expense.expenseId}
      className={`p-4 cursor-pointer ${expense.isDeleted ? 'bg-gray-200' : 'border rounded-md shadow-md'}`}
      onClick={() => router.push(`/dashboard/activity/expenseReport?expenseId=${expense.expenseId}`)}
    >
      <div className="mb-2 flex justify-between">
        <div>
          <h3 className="text-lg font-bold">{expense.description}</h3>
          <p className="text-sm text-gray-600">
            Amount: Rs{expense.amount} | Date: {format(new Date(expense.date), "dd/MM/yyyy, hh:mm a")}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`${
              expense.balance > 0
                ? 'text-green-500'
                : expense.balance < 0
                ? 'text-red-500'
                : 'text-gray-500'
            }`}
          >
            {expense.balance > 0
              ? `You get back: Rs${expense.balance}`
              : expense.balance < 0
              ? `You owe: Rs${Math.abs(expense.balance)}`
              : `You are settled`}
          </p>
        </div>
      </div>
      {expense.isDeleted && <p className="text-gray-500 mt-2">This expense has been deleted.</p>}
    </Card>
  ))}
</div>

    </div>
  );
}

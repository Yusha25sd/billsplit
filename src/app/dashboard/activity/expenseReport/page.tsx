'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Expense, ExpenseSplit } from '@/schemas/expense';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { format } from 'date-fns';

interface ExpenseSplitWithUser extends ExpenseSplit {
  username: string;
  email: string;
}

export default function ExpenseReport() {
  const searchParams = useSearchParams();
  const expenseId = searchParams.get('expenseId');
  const [expense, setExpense] = useState<Expense | null>(null);
  const [participants, setParticipants] = useState<ExpenseSplitWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!expenseId) {
      toast({ title: 'Error', description: 'Expense ID is missing.', variant: 'destructive' });
      return;
    }

    const fetchExpenseDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/expenses/getExpenseReport?expenseId=${expenseId}`);
        const data = res.data;

        if (data.success) {
          setExpense(data.data.expense);
          setParticipants(data.data.participants);
        } else {
          toast({ title: 'Error', description: data.message, variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to fetch expense details.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [expenseId]);

  const handleEdit = () => {
    router.push(`/dashboard?expenseId=${expenseId}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      setLoading(true);
      const res = await axios.post(`/api/expenses/deleteExpense`, { expenseId });

      const data = res.data;

      if (data.success) {
        toast({ title: 'Success', description: 'Expense deleted successfully.' });
        router.push('/dashboard/activity');
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete expense.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-teal-700 flex justify-center items-center h-full">Loading...</div>;

  if (!expense) return <div>Expense not found.</div>;

  const userDetails = participants.find((participant) => participant.userId === userId);
  return (
    <div className="text-teal-700 container mx-auto p-4">
      <Card className={`p-4 ${expense.isDeleted ? 'bg-gray-200' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">{expense.description}</h2>
          <p className={`text-lg font-semibold ${!userDetails ? 'text-gray-500' : userDetails.balance > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {userDetails
              ? userDetails.balance > 0
                ? `You get back: Rs${userDetails.balance}`
                : `You owe: Rs${Math.abs(userDetails.balance)}`
              : 'You are not involved'}
          </p>
        </div>
        <p className="mb-1">Amount: Rs{expense.amount}</p>
        <p className="mb-1">Created At: {format(new Date(expense.date), "dd/MM/yyyy, hh:mm a")}</p>

        {expense.isDeleted && (
          <p className="text-gray-500 font-bold mb-2">This expense has been marked as deleted.</p>
        )}

        <h3 className="text-lg font-semibold mt-4">Participants:</h3>
        <ul className="space-y-3">
          {participants.map((participant) => (
            <li
              key={participant.userId}
              className="flex justify-between items-center p-4 border rounded-md shadow-sm"
            >
              <div>
                <p className="font-medium">{participant.username}</p>
                <p className="text-sm text-gray-600">({participant.email})</p>
              </div>
              <div className="text-right flex space-x-4">
                <p className="text-sm">
                  Paid: <span className={participant.amountPaid ? 'text-green-600' : 'text-gray-500'}>Rs {participant.amountPaid || 'None'}</span>
                </p>
                <p className="text-sm">
                  Owes: <span className={participant.amountOwed ? 'text-red-600' : 'text-gray-500'}>Rs {participant.amountOwed || 'None'}</span>
                </p>
                {participant.amountPaid === 0 && participant.amountOwed === 0 && (
                  <p className="text-xs text-gray-500">Settled</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {!expense.isDeleted ? (
          <div className="mt-6 flex justify-center gap-4">
            <Button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-40 py-2"
            >
              Edit Expense
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white py-2 w-40 rounded-lg"
            >
              {loading ? 'Deleting...' : 'Delete Expense'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex justify-center gap-4">
            <Button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-40 py-2"
            >
              Edit Expense
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

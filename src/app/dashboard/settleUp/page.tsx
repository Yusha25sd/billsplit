'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface Member {
  memberId: string;
  name: string;
  email: string;
  balance: number;
}

interface SettleAmount {
  memberId: string;
  amount: number;
}

const SettleUpPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settleAmounts, setSettleAmounts] = useState<SettleAmount[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const friendId = searchParams.get('friendId');
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!userId && (!groupId || !friendId)) return;

    const fetchAmounts = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/users/settleUp?userId=${userId}&friendId=${friendId}&groupId=${groupId}`);
        const data = response.data.data || []; 
        setMembers(data);

        const initialAmounts: SettleAmount[] = data.map((member: Member) => ({
          memberId: member.memberId,
          amount: 0,
        }));
        setSettleAmounts(initialAmounts);

        setError('');
      } catch {
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchAmounts();
  }, [userId, groupId, friendId]);

  const handleAmountChange = (memberId: string, value: string) => {
    setSettleAmounts((prev) =>
      prev.map((item) =>
        item.memberId === memberId
          ? { ...item, amount: parseFloat(value) || 0 }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    try {
      for (const expense of settleAmounts) {
        await axios.post('/api/expenses/addExpense', {
          userId,
          amount: expense.amount,
          splits: [{
            userId, // User making the payment
            amountPaid: expense.amount,
            amountOwed: 0,
          },
          {
            userId: expense.memberId, // Recipient
            amountPaid: 0,
            amountOwed: expense.amount,
          }],
          description: 'Settle-up payment',
          groupId,
        });
      }

      alert('Settlements recorded successfully!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error submitting settlements:', err);
      alert('Failed to record settlements. Please try again.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settle Up</h1>

      {members.length === 0 ? (
        <p>No members to settle with.</p>
      ) : (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{friendId ? 'Friend' : 'Group Members'}</h2>
          {members.map((member) => {
            const settleAmount = settleAmounts.find(
              (item) => item.memberId === member.memberId
            );

            return (
              <div key={member.memberId} className="p-4 border rounded-md shadow-sm mb-4">
                <p className="font-bold">{member.name} ({member.email})</p>
                <p className={`text-lg font-semibold ${member.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {member.balance >= 0 ? `Owes you ₹${member.balance}` : `You owe ₹${Math.abs(member.balance)}`}
                </p>
                <input
                  type="number"
                  className="mt-2 p-2 border rounded-md w-full"
                  value={settleAmount?.amount || 0}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === '+' || e.key === 'e') {
                      e.preventDefault(); // Prevent the input of -, +, and e
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!isNaN(Number(value))) {
                      handleAmountChange(member.memberId, value);
                    }
                  }}
                  placeholder="Enter amount"
                />

              </div>
            );
          })}

        </div>
      )}

      <Button onClick={handleSubmit} className="w-full mt-4">
        Submit Settlements
      </Button>
    </div>
  );
};

export default SettleUpPage;

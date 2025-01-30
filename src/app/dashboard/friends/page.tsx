'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card } from '@/components/ui/card';

interface FriendDetails {
  friendId: string;
  friendName: string;
  friendEmail: string;
  balance: number;
}

const FriendsPage = () => {
  const [friends, setFriends] = useState<FriendDetails[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user.id;

  useEffect(() => {
    const fetchFriends = async () => {
      if (status === 'loading') {
        return; // Wait for the session to load
      }

      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/friends/getFriends?userId=${userId}`);
        if (!response.data.success) {
          throw new Error('Failed to fetch friends data');
        }

        const data = response.data;
        setFriends(data.friendBalances);
        setTotalBalance(data.totalBalance);
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Something went wrong');
        }
        setLoading(false);
      }
    };

    fetchFriends();
  }, [status, session]);

  if (status === 'loading' || loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!friends || friends.length === 0) {
    return <p className="text-gray-500">No friends to display.</p>;
  }

  return (
    <div className="p-6 text-teal-700">
      <div className="mb-4 p-4 rounded-lg flex justify-between items-center">
        {/* Friends header aligned to the left */}
        <h1 className="text-teal-800 text-2xl font-bold mb-4">Friends</h1>

        {/* Balance info aligned to the right */}
        <p
          className={`text-lg font-medium ${
            totalBalance > 0
              ? "text-green-500"
              : totalBalance < 0
              ? "text-red-500"
              : "text-gray-500"
          }`}
        >
          {totalBalance > 0
            ? `You are owed ₹${totalBalance}`
            : totalBalance < 0
            ? `You owe ₹${Math.abs(totalBalance)}`
            : "You are settled up"}
        </p>
      </div>
      <ul>
  {friends.map((friend) => (
    <Card
      key={friend.friendId}
      className="flex justify-between items-center p-4 border rounded-md shadow-md cursor-pointer hover:bg-gray-50"
      onClick={() =>
        router.push(
          `/dashboard/friends/sharedActivity?userId=${userId}&friendId=${friend.friendId}`
        )
      }
    >
      <div>
        <p className="font-medium">{friend.friendName} ({friend.friendEmail})</p>
      </div>
      <div className="text-right">
        <p
          className={`text-lg ${
            friend.balance > 0
              ? "text-green-500"
              : friend.balance < 0
              ? "text-red-500"
              : "text-gray-500"
          }`}
        >
          {friend.balance > 0
            ? `Owes you ₹${friend.balance}`
            : friend.balance < 0
            ? `You owe ₹${Math.abs(friend.balance)}`
            : "You are settled"}
        </p>
      </div>
    </Card>
  ))}
</ul>

    </div>
  );
};

export default FriendsPage;

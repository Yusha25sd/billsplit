'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Groups } from '@/schemas/group';
import { format } from 'date-fns';

interface Group extends Groups {
  userBalance: number;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user.id;

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !userId) {
      console.error('User is not authenticated or userId is missing.');
      router.push('/login');
      return;
    }

    const fetchGroups = async () => {
      try {
        const res = await axios.get(`/api/groups/getGroups?userId=${userId}`);
        const data = res.data;
        if (data.success) {
          setGroups(data.groups);
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [status, userId, router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
  <Button
    onClick={() => router.push('/dashboard/groups/createGroup')}
    className="w-full bg-blue-500 hover:bg-blue-600 text-white mb-6 rounded-lg"
  >
    Create New Group
  </Button>

  <h1 className="text-teal-800 text-2xl font-bold mb-6">Your Groups</h1>

  <ul className="space-y-4">
    {groups.length > 0 ? (
      groups.map((group) => (
        <li
          key={group.groupId}
          className="border p-4 rounded-md shadow-md flex justify-between items-center cursor-pointer"
          onClick={() => router.push(`/dashboard/groups/groupReport?groupId=${group.groupId}`)}
        >
          {/* Left Section: Group Info */}
          <div>
            <h2 className="text-teal-700 text-xl font-semibold">{group.name}</h2>
            <p className="text-sm text-gray-600">
              Created At: {format(new Date(group.createdAt), "do MMMM yyyy")}
            </p>
          </div>

          {/* Right Section: Balance Info */}
          <p
            className={`text-base text-right ${
              group.userBalance > 0
                ? "text-green-500"
                : group.userBalance < 0
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {group.userBalance > 0
              ? `You are owed ₹${group.userBalance}`
              : group.userBalance < 0
              ? `You owe ₹${Math.abs(group.userBalance)}`
              : "You are settled"}
          </p>
        </li>
      ))
    ) : (
      <p className="text-gray-500 text-center">No groups found. Create one above!</p>
    )}
  </ul>
</div>

  );
}

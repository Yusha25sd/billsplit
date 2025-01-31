'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { UserProfile, UserSearchResult } from '@/schemas/user';
import axios from 'axios';

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [addedMembers, setAddedMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch users based on search query
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    // Ensure at least 3 characters are entered
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/users/getUser?name=${searchQuery}`);
        setSearchResults(res.data.data);
      } catch (err) {
        console.error('Failed to search users:', err);
        toast({
          title: 'Error',
          description: 'Failed to search users. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchQuery]);

  // Add a user to the group
  const addMember = (user: UserProfile) => {
    if (!addedMembers.find((member) => member.userId === user.userId)) {
      setAddedMembers((prev) => [...prev, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove a user from the group
  const removeMember = (userId: string) => {
    setAddedMembers((prev) => prev.filter((member) => member.userId !== userId));
  };

  // Submit the group details
  const handleSubmit = async () => {
    if (!groupName || addedMembers.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Group name and at least one member are required.',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      const res = await axios.post('/api/groups/createGroup', {
        name: groupName,
        members: addedMembers.map((member) => member.userId),
      });
  
      if (res.data.success) {
        toast({
          title: 'Success',
          description: 'Group created successfully!',
        });
        router.push(`/dashboard/groups/groupReport?groupId=${res.data.data}`);
      } else {
        toast({
          title: 'Error',
          description: res.data.message || 'Failed to create group.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };
  

  return (
    <div className="text-black container mx-auto p-4">
      <h1 className="text-teal-800 text-2xl font-bold mb-4">Create Group</h1>

      {/* Group Name */}
      <div className="mb-6">
        <label htmlFor="groupName" className="text-teal-700 text-lg block font-medium mb-2">
          Group Name 
        </label>
        <Input
          id="groupName"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          className="bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <label htmlFor="search" className="text-teal-700 text-lg block font-medium mb-2">
          Add Members
        </label>
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users"
            className="bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-gray-500 mt-2">Type at least 3 characters to search.</p>
        )}
        {loading && <p className="text-gray-500 mt-2">Searching...</p>}
        {!loading && searchQuery.length >= 3 && searchResults.length === 0 && (
          <p className="text-gray-500 mt-2">No user found</p>
        )}
        <div className="absolute w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-md z-10">
        <ul>
          {searchResults.map((user) => (
            <li
              key={user.userId}
              className="flex justify-between items-center border p-2 rounded-md"
              onClick={() => addMember(user)}
            >
              {user.username}({user.email})
            </li>
          ))}
        </ul>
        </div>
      </div>

      {/* Added Members */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Group Members</h2>
        <ul className="space-y-2">
          {addedMembers.map((member) => (
            <li
              key={member.userId}
              className="flex justify-between items-center border p-2 rounded-md"
            >
            {member.username}({member.email}) 
              <Button
                onClick={() => removeMember(member.userId)}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full bg-green-500 text-white hover:bg-green-600"
      >
        Save Group
      </Button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import { ExpenseSplit } from "@/schemas/expense";
import { UserSearchResult } from "@/schemas/user";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expenseId = searchParams.get("expenseId");
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    groupId: "null",
    splits: [] as ExpenseSplit[],
    isEqualSplit: true,
  });

  const [groups, setGroups] = useState<{ groupId: string; name: string }[]>(
    []
  );
  const [searchName, setSearchName] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    if (expenseId) {
      const fetchExpenseDetails = async () => {
        try {
          const response = await axios.get(
            `/api/expenses/getExpenseReport?expenseId=${expenseId}`
          );
          const { expense, participants } = response.data.data;

          setFormData({
            amount: expense.amount.toString(),
            description: expense.description,
            groupId: expense.groupId || "null",
            splits: participants.map((participant: any) => ({
              userId: participant.userId,
              amountPaid: parseFloat(participant.amountPaid),
              amountOwed: parseFloat(participant.amountOwed),
            })),
            isEqualSplit: participants.every(
              (participant: any) =>
                parseFloat(participant.amountPaid) ===
                  expense.amount / participants.length &&
                parseFloat(participant.amountOwed) ===
                  expense.amount / participants.length
            ),
          });

          const participantDetails = participants.map((participant: any) => ({
            userId: participant.userId,
            username: participant.username,
            email: participant.email,
          }));

          setSelectedUsers(participantDetails);
        } catch (error) {
          console.error("Error fetching expense details:", error);
          toast({
            title: "Error",
            description: "Failed to fetch expense details.",
            variant: "destructive",
          });
        }
      };

      fetchExpenseDetails();
    }
  }, [expenseId]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Check if session is available and contains user data
        setLoadingGroup(true);
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error("User is not authenticated");
        }
        const response = await axios.get(`/api/groups/getGroups?userId=${userId}`);
        setGroups(response.data.groups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast({
          title: "Error",
          description: "Failed to fetch groups.",
          variant: "destructive",
        });
      } finally {
        setLoadingGroup(false);
      }
    };
  
    if (session?.user?.id) {
      fetchGroups();
    }
  }, [session]);
  

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchName.length >= 3) {
        handleSearch(searchName);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchName]);

  const handleSearch = async (name: string) => {
    if (name.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingUser(true);
      const response = await axios.get("/api/users/getUser", {
        params: { name, groupId: formData.groupId },
      });
      setSearchResults(response.data.data);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users.",
        variant: "destructive",
      });
    } finally {
      setLoadingUser(false);
    }
  };

  const handleAddUser = async (user: UserSearchResult) => {
    if (!selectedUsers.some((u) => u.userId === user.userId)) {
      setSelectedUsers((prev) => [...prev, user]);

      setFormData((prev) => ({
        ...prev,
        splits: [
          ...prev.splits,
          {
            userId: user.userId,
            amountPaid: 0,
            amountOwed: 0,
            expenseId: expenseId || "",
            balance: 0,
          },
        ],
      }));
    }
    setSearchName("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.userId !== userId));
    setFormData((prev) => ({
      ...prev,
      splits: prev.splits.filter((split) => split.userId !== userId),
    }));
  };

  const handleSplitChange = (
    userId: string,
    field: "amountPaid" | "amountOwed",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      splits: prev.splits.map((split) =>
        split.userId === userId
          ? { ...split, [field]: parseFloat(value) || 0 }
          : split
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = session?.user?.id;
    try {
      setLoading(true);
      const response = await axios.post("/api/expenses/addExpense", {
        ...formData,
        expenseId,
        userId,
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Expense saved successfully.",
          variant: "default",
        });
        const newExpensedetails = response.data as {
          message: string;
          newExpenseId: string;
          success: boolean;
        };
        router.push(
          `/dashboard/activity/expenseReport?expenseId=${newExpensedetails.newExpenseId}`
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const responseMessage = axiosError.response?.data as {
        message: string;
        success: boolean;
      };
      toast({
        title: "Error",
        description: responseMessage.message || "Failed to save expense.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEqualSplit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(formData.amount);
    const numParticipants = selectedUsers.length;

    if (!totalAmount || numParticipants === 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount and add participants.",
        variant: "destructive",
      });
      return;
    }

    const equalAmount = parseFloat((totalAmount / numParticipants).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      splits: prev.splits.map((split) => ({
        ...split,
        amountOwed: equalAmount,
      })),
      isEqualSplit: true,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGroupChange = async (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      groupId,
      splits: [], // Reset splits
    }));
    setSelectedUsers([]); // Reset selected users
    
    if (groupId !== "null") {
      try {
        const response = await axios.get(`/api/groups/getGroupMembers?groupId=${groupId}`);
        const groupMembers = response.data.data; // Assuming response contains members' data
  
        // Automatically add all group members with default splits (amountPaid = 0, amountOwed = 0)
        setSelectedUsers(groupMembers);
        
        setFormData((prev) => ({
          ...prev,
          splits: groupMembers.map((member: any) => ({
            userId: member.userId,
            amountPaid: 0,
            amountOwed: 0,
            expenseId: expenseId || "",
            balance: 0,
          })),
        }));
      } catch (error) {
        console.error("Error fetching group members:", error);
        toast({
          title: "Error",
          description: "Failed to fetch group members.",
          variant: "destructive",
        });
      }
    }
  };
  

  return (
    <Card className="text-teal-700 w-full rounded-none border-none shadow-none">

      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
          <div>
              <Label htmlFor="description" className="text-lg font-semibold mb-4">Description</Label>
              <Input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
          </div>
            <div>
              <Label htmlFor="amount" className="text-lg font-semibold mb-4">Amount</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label className="text-lg font-semibold mb-4">Group</Label>
              <Select
                onValueChange={handleGroupChange}
                value={formData.groupId}
                
              >
                <SelectTrigger className="bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black border border-gray-300 rounded-lg shadow-lg">
                  <SelectItem key="null" value={'null'}>
                    Non-group
                  </SelectItem>
                  {loadingGroup ? (
                    <p>Loading groups...</p>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.groupId} value={group.groupId}>
                        {group.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

            </div>

            <div className="relative">
              {/* Search User */}
              <Label htmlFor="search" className="text-lg font-semibold mb-4">Add Participants</Label>
              <Input
                type="text"
                id="search"
                name="search"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search by name"
                className="bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              />

              {/* Search Results Dropdown */}
              {searchName.length >= 3 && (
              <div className="absolute w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-md z-10">
                <ul>
                  {loadingUser ? (
                    <p className="px-4 py-2">...Searching</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-2">No user found</p>
                  ) : (
                    searchResults.map((user) => (
                      <li
                        key={user.userId}
                        onClick={() => handleAddUser(user)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                      >
                        {user.username} ({user.email})
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Added:</h3>
              <ul>
                {selectedUsers.map((user) => (
                  <li
                    key={user.userId}
                    className="flex justify-between items-center mb-3 border-b pb-3"
                  >
                    <span className="flex-1">
                      {user.username}({user.email})
                    </span>

                    {/* Amount Paid */}
                    <div className="flex-1 flex flex-col items-center">
                      <Label className="mb-1">Amount Paid</Label>
                      <input
                        type="number"
                        placeholder="Amount Paid"
                        value={
                          formData.splits.find((split) => split.userId === user.userId)?.amountPaid || 0
                        }
                        onChange={(e) =>
                          handleSplitChange(user.userId, 'amountPaid', e.target.value)
                        }
                        className="w-20 text-center border rounded px-2 py-1"
                      />
                    </div>

                    {/* Amount Owed */}
                    <div className="flex-1 flex flex-col items-center">
                      <Label className="mb-1">Amount Owed</Label>
                      <input
                        type="number"
                        placeholder="Amount Owed"
                        value={
                          formData.splits.find((split) => split.userId === user.userId)?.amountOwed || 0
                        }
                        onChange={(e) =>
                          handleSplitChange(user.userId, 'amountOwed', e.target.value)
                        }
                        className="w-20 text-center border rounded px-2 py-1"
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      onClick={() => handleRemoveUser(user.userId)}
                      className="flex-0.5 text-center bg-red-600 text-white py-1 px-4 rounded-lg"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <CardFooter className="flex justify-center space-x-4 p-4 bg-gray-100 rounded-b-lg">
              <Button
                onClick={handleEqualSplit}
                className="bg-green-600 text-white py-2 px-6 rounded-lg"
              >
                Split Equally
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg ${
                  loading ? 'bg-blue-300 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Expense'}
              </Button>
            </CardFooter>
        </div>
      </form>
    </CardContent>
  </Card>
);
};

  export default Dashboard;
                
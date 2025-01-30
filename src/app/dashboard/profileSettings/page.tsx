"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useSession } from "next-auth/react";

interface UserProfile {
  username: string;
  email: string;
  joiningDate: string;
}

interface TotalExpense {
  month: string;
  monthlyExpense: number;
}

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [totalExpenses, setTotalExpenses] = useState<TotalExpense[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const { toast } = useToast();
  const { data: session } = useSession();

  // Fetch user details and monthly expenses
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true); // Start loading
      try {
        const userId = session?.user?.id;
        if (userId) {
          const response = await axios.get(`/api/users/getProfile?userId=${userId}`);
          setUser(response.data.user);
          setTotalExpenses(response.data.totalExpenses);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({ title: "Failed to fetch profile data", variant: "destructive" });
      } finally {
        setLoading(false); // End loading
      }
    };

    if (session) {
      fetchProfileData();
    }
  }, [session]);

  // Handle username change
  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      toast({ title: "Username cannot be empty!", variant: "destructive" });
      return;
    }

    try {
      const userId = session?.user?.id;
      const response = await axios.put("/api/users/updateUsername", {
        username: newUsername,
        userId,
      });

      if (!response.data.success) {
        toast({ title: "Username couldn't be changed!", variant: "destructive" });
        return;
      }
      setUser((prev) => (prev ? { ...prev, username: newUsername } : null));
      toast({ title: "Username updated successfully!" });
    } catch (error) {
      console.error("Error updating username:", error);
      toast({ title: "Failed to update username", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="text-teal-700 max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          {user && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  type="text"
                  value={newUsername || user.username}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="mb-2"
                />
                <Button onClick={handleUsernameChange} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg w-40 py-2">Update Username</Button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="text" value={user.email} disabled />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Joining Date</label>
                <Input
                  type="text"
                  value={format(new Date(user.joiningDate), "do MMM yyyy")}
                  disabled
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Monthly Expenses</h2>
          <div className="space-y-2">
            {totalExpenses.length > 0 ? (
              totalExpenses.map((expense) => (
                <div
                  key={expense.month}
                  className="flex justify-between border-b py-2"
                >
                  <span>{format(new Date(expense.month), "MMMM")}</span>
                  <span className={`text-lg font-semibold ${
                    expense.monthlyExpense > 0 ? 'text-green-500' 
                    : expense.monthlyExpense < 0 ? 'text-red-500'
                    : 'text-gray-500'
                  }`}
                >
                  {expense.monthlyExpense > 0
                    ? `You got ₹${expense.monthlyExpense}`
                    : expense.monthlyExpense < 0
                    ? `You expended ₹${Math.abs(expense.monthlyExpense)}`
                    : `No expend`}</span>
                </div>
              ))
            ) : (
              <p>No expense data available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;


export type Expense = {
  expenseId: string;
  userId: string;  // Added userId to associate with the expense creator
  amount: number;
  description: string;
  date: string;
  isDeleted: boolean;
  groupId?: number;
};

export type ExpenseSplit = {
  expenseId: string;
  userId: string;
  amountPaid: number;
  amountOwed: number;
  balance: number
};



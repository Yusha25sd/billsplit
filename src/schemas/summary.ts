import { Expense } from './expense';

export type MonthlySpending = {
  month: string;           // Month name, e.g., "January"
  amountSpent: number;     // Total amount the user spent that month
};

export type ExpenseSummary = {
  totalExpenses: number;            // Total expenses for the year
  monthlySpending: MonthlySpending[]; // Array with spending details for each month
  expenses: Expense[];              // Individual expense details for reference
};

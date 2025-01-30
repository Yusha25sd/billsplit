export type Groups = {
  groupId: number;
  name: string;  // List of userIds for group members
  createdAt: string;
  groupExpense: number;
};

export type GroupBalances = { 
  groupId: number;
  userId: number;
  memberId: number;
  balance: number;
};
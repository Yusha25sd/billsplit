export type FriendBalance = {
  userId: string;
  friendId: string;
  balance: number; // positive if friend owes, negative if user owes
};

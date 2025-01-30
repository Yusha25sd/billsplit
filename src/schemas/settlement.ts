import { UserId } from '../types/index';

export type Settlement = {
  settlementId: string;
  fromUser: UserId;
  toUser: UserId;
  groupId: string;
  amount: number;
};

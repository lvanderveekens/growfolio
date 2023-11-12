export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  investmentId: string;
  amount: number;
}

export enum TransactionType {
  BUY = "buy",
  SELL = "sell",
}

export const labelsByTransactionType: { [type: string]: string } = {
  [TransactionType.BUY]: "Buy",
  [TransactionType.SELL]: "Sell",
};
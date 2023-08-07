export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  investmentId: string;
  amount: number;
}

export enum TransactionType {
  Buy = "buy",
  Sell = "sell",
}

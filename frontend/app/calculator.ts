import { Transaction, TransactionType } from "./investments/transaction";
import { InvestmentUpdate } from "./overview-page";

export const calculateTotalPrincipalForDate = (
  date: string,
  transactions: Transaction[]
) => {
  let sum = 0;

  for (const transaction of transactions) {
    if (new Date(transaction.date) > new Date(date)) {
      break;
    }
    if (transaction.type == TransactionType.BUY) {
      sum += transaction.amount;
    } else {
      sum -= transaction.amount;
    }
  }
  return Math.max(0, sum);
};

export const calculateTotalValueForDate = (
  date: string,
  updates: InvestmentUpdate[]
) => {
  const latestValueByInvestmentId = new Map<string, number>();

  for (const update of updates) {
    if (new Date(update.date) > new Date(date)) {
      break;
    }
    latestValueByInvestmentId.set(update.investmentId, update.value);
  }

  return Array.from(latestValueByInvestmentId.values()).reduce(
    (acc, value) => acc + value,
    0
  );
};

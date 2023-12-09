import { InvestmentUpdate } from "./overview-page";

export const calculateCost = (
  investmentUpdates: InvestmentUpdate[]
) => {
  let sum = 0;
  for (const investmentUpdate of investmentUpdates) {
    if (investmentUpdate.deposit) {
      sum += investmentUpdate.deposit;
    }
    if (investmentUpdate.withdrawal) {
      sum -= investmentUpdate.withdrawal;
    }
  }
  return Math.max(0, sum);
};

export const calculateCostForDate = (
  date: string,
  investmentUpdates: InvestmentUpdate[]
): number => {
  return calculateCost(investmentUpdates.filter((update) => new Date(update.date) <= new Date(date)))
};

export const calculateValueForDate = (
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

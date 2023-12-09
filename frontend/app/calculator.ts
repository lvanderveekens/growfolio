import { InvestmentUpdate } from "./overview-page";

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

export const calculateCostForDate = (
  date: string,
  updates: InvestmentUpdate[]
) => {
  const latestCostByInvestmentId = new Map<string, number>();

  for (const update of updates) {
    if (new Date(update.date) > new Date(date)) {
      break;
    }
    latestCostByInvestmentId.set(update.investmentId, update.cost);
  }

  return Array.from(latestCostByInvestmentId.values()).reduce(
    (acc, value) => acc + value,
    0
  );
};

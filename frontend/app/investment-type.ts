export enum InvestmentType {
  STOCK = "stock",
  BOND = "bond",
  COMMODITY = "commodity",
  FUND = "fund",
  CRYPTO = "crypto",
  CASH = "cash",
}

export const labelsByInvestmentType: { [type: string]: string } = {
  [InvestmentType.STOCK]: "Stock",
  [InvestmentType.BOND]: "Bond",
  [InvestmentType.COMMODITY]: "Commodity",
  [InvestmentType.FUND]: "Fund",
  [InvestmentType.CRYPTO]: "Crypto",
  [InvestmentType.CASH]: "Cash",
};
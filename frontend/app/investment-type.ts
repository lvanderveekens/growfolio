export enum InvestmentType {
  STOCK = "stock",
  BOND = "bond",
  COMMODITY = "commodity",
  FUND = "fund",
  CRYPTO = "crypto",
  CASH = "cash",
  P2P_LENDING = "p2pLending",
  REAL_ESTATE = "realEstate",
  FOREX = "forex",
}

export const labelsByInvestmentType: { [type: string]: string } = {
  [InvestmentType.STOCK]: "Stock",
  [InvestmentType.BOND]: "Bond",
  [InvestmentType.COMMODITY]: "Commodity",
  [InvestmentType.FUND]: "Fund",
  [InvestmentType.CRYPTO]: "Crypto",
  [InvestmentType.CASH]: "Cash",
  [InvestmentType.P2P_LENDING]: "P2P Lending",
  [InvestmentType.REAL_ESTATE]: "Real Estate",
  [InvestmentType.FOREX]: "Forex",
};
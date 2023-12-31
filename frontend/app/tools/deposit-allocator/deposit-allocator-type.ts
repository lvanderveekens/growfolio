export enum DepositAllocatorType {
  INVESTMENT = "investment",
  INVESTMENT_TYPE = "investmentType",
}

export const labelsByDepositAllocatorType: { [type: string]: string } = {
  [DepositAllocatorType.INVESTMENT]: "Investment",
  [DepositAllocatorType.INVESTMENT_TYPE]: "Investment type",
};
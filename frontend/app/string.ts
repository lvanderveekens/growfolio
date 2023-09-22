
export const formatAmountInCentsAsEuroString = (amountInCents: number) => {
  return formatAmountAsEuroString(amountInCents / 100)
}

export const formatAmountAsEuroString = (amount: number) => {
  return amount.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function formatAsPercentage(number: number) {
  return number.toLocaleString("nl-NL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
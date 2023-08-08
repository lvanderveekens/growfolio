
export const formatAsEuroAmount = (amount: number) => {
  const euroAmount = amount / 100;
  return "€ " + euroAmount.toFixed(2);
};

export function formatAsPercentage(number: number) {
  return (number * 100).toFixed(2) + "%";
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
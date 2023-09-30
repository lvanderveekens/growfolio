
export const formatAmountInCentsAsEuroString = (amountInCents: number) => {
  return formatAmountAsEuroString(amountInCents / 100)
}

export const formatAmountInCentsAsReturnString = (amountInCents: number) => {
  const euroString = formatAmountAsEuroString(amountInCents / 100)

  if (amountInCents > 0) {
    return `+${euroString}`;
  } else if (amountInCents < 0) {
    return `-${euroString}`;
  } else {
    return euroString; 
  }
}

export const formatAmountAsEuroString = (amount: number) => {
  return amount.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function formatAsROIPercentage(number: number) {
  const percentageString = number.toLocaleString("nl-NL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (number > 0) {
    return `+${percentageString}`;
  } else if (number < 0) {
    return `-${percentageString}`;
  } else {
    return percentageString; 
  }
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
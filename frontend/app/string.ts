import { localesByCurrency } from "./settings/settings";

export const formatAmountInCentsAsCurrencyString = (amountInCents?: number, currency: string) => {
  if (amountInCents == undefined) {
    return "-"
  }
  return formatAmountAsCurrencyString(amountInCents / 100, currency)
}

export const formatAmountInCentsAsReturnString = (amountInCents: number, currency: string) => {
  const euroString = formatAmountAsCurrencyString(amountInCents / 100, currency)

  if (amountInCents > 0) {
    return `+${euroString}`;
  } else if (amountInCents < 0) {
    return `-${euroString}`;
  } else {
    return euroString; 
  }
}

export const formatAmountAsCurrencyString = (amount?: number, currency: string) => {
  if (amount == undefined) {
    return "-"
  }
  if (isNaN(amount)) {
    amount = 0;
  }

  const locale = localesByCurrency[currency]

  return amount.toLocaleString(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function formatAsROIPercentage(number?: number) {
  if (number == undefined) {
    return "-"
  }
  if (isNaN(number)) {
    number = 0;
  }
  const percentageString = number.toLocaleString("nl-NL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (number > 0) {
    return `+${percentageString}`;
  } else {
    return percentageString;
  }
}

export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
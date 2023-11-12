export interface Settings {
  currency: string;
}

export enum Currency {
  EUR = "EUR",
  USD = "USD",
}

export const labelsByCurrency: { [currency: string]: string } = {
  "EUR": "Euro",
  "USD": "US Dollar",
};

export const localesByCurrency: { [currency: string]: string } = {
  "EUR": "nl-NL",
  "USD": "en-US",
};

export const signPrefixesByCurrency: { [currency: string]: string } = {
  "EUR": "€ ",
  "USD": "$",
};

export const groupSeparatorsByCurrency: { [currency: string]: string } = {
  "EUR": ".",
  "USD": ",",
};

export const decimalSeparatorsByCurrency: { [currency: string]: string } = {
  "EUR": ",",
  "USD": ".",
};
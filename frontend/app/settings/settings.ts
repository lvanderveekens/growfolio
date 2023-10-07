export interface Settings {
  currency: string;
}

export const localesByCurrency: { [currency: string]: string } = {
  EUR: "nl-NL",
  USD: "en-US",
};

export enum Currency {
  EUR = "Euro",
  USD = "US Dollar",
}
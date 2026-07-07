export const CURRENCIES = [
  { code: "INR", label: "Indian Rupee" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "AED", label: "UAE Dirham" },
] as const;

const localeFor = (currency: string) =>
  currency === "INR" ? "en-IN" : undefined;

export function formatMoney(
  amount: number,
  currency: string,
  options?: { compact?: boolean }
): string {
  const abs = Math.abs(amount);
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    notation: options?.compact && abs >= 100000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function currencySymbol(currency: string): string {
  const part = new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
  })
    .formatToParts(0)
    .find((p) => p.type === "currency");
  return part?.value ?? currency;
}

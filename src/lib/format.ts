// FILE: src/lib/format.ts

/** Map a currency code to the best default locale for formatting */
export function defaultLocaleFor(currency: string) {
  const c = String(currency || "").toUpperCase();
  if (c === "INR") return "en-IN";
  if (c === "USD") return "en-US";
  if (c === "GBP") return "en-GB";
  return "en-GB";
}

/** Currency symbol for quick labels; for rendering use formatMoney */
export function currencySymbol(currency: string) {
  const c = String(currency || "").toUpperCase();
  if (c === "INR") return "₹";
  if (c === "USD") return "$";
  if (c === "GBP") return "£";
  return c;
}

/** Format minor units (pence/cent/paise) as currency */
export function formatMoney(
  minorUnits: number,
  currency: string,
  locale?: string
) {
  const loc = locale || defaultLocaleFor(currency);
  const major = (minorUnits ?? 0) / 100;
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: String(currency || "GBP").toUpperCase(),
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(major);
}

/** Convenience for places that still give a major-unit number */
export function formatFromMajor(
  major: number,
  currency: string,
  locale?: string
) {
  return formatMoney(Math.round((major ?? 0) * 100), currency, locale);
}

/** Legacy wrapper (kept so old imports don’t explode while migrating) */
export function formatGBP(pence: number) {
  return formatMoney(pence, "GBP", "en-GB");
}

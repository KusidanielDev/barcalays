export function formatGBP(pence: number) {
  const pounds = pence / 100;
  return pounds.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

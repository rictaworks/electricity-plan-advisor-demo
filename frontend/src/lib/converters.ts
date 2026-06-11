const YEN_TO_KWH_RATE = 30.0;

export function yenToKwh(yen: number): number {
  if (yen <= 0) return 0;
  return Math.round((yen / YEN_TO_KWH_RATE) * 10) / 10;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKwh(value: number): string {
  return `${value.toLocaleString("ja-JP")} kWh`;
}

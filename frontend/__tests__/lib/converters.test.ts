import { yenToKwh, formatCurrency, formatKwh } from "@/lib/converters";

describe("yenToKwh", () => {
  it("converts 3000 yen to 100 kWh", () => {
    expect(yenToKwh(3000)).toBe(100);
  });

  it("returns 0 for 0 yen", () => {
    expect(yenToKwh(0)).toBe(0);
  });

  it("returns 0 for negative yen", () => {
    expect(yenToKwh(-100)).toBe(0);
  });

  it("rounds to one decimal", () => {
    const result = yenToKwh(1000);
    expect(result).toBe(33.3);
  });
});

describe("formatCurrency", () => {
  it("formats yen with currency symbol", () => {
    const result = formatCurrency(10000);
    expect(result).toContain("10,000");
  });
});

describe("formatKwh", () => {
  it("appends kWh unit", () => {
    expect(formatKwh(300)).toBe("300 kWh");
  });
});

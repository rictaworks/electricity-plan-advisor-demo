import { describe, it, expect } from "vitest";
import { RankingGenerator } from "./ranking";
import { ElectricityCalculator } from "./calculator";
import type { PlanMaster } from "./types";

const plan = (overrides: Partial<PlanMaster>): PlanMaster => ({
  id: 1,
  plan_code: "P1",
  company_name: "会社",
  plan_name: "プラン",
  region: "tokyo",
  ampere: 30,
  base_fee: 858,
  unit_price_1: 29.8,
  threshold_1: 120,
  unit_price_2: 36.4,
  threshold_2: 300,
  unit_price_3: 40.69,
  has_time_based: 0,
  night_discount_rate: 0,
  bank_discount: 55,
  renewable_surcharge: 1,
  notes: null,
  ...overrides
});

const plans: PlanMaster[] = [
  plan({ id: 1, plan_code: "TEPCO_STD" }),
  plan({ id: 2, plan_code: "CHEAP", base_fee: 300, unit_price_1: 20, unit_price_2: 25, unit_price_3: 28 }),
  plan({ id: 3, plan_code: "PRICEY", base_fee: 2000, unit_price_1: 40, unit_price_2: 45, unit_price_3: 50 })
];

describe("RankingGenerator.generate", () => {
  const calc = new ElectricityCalculator();
  const generator = new RankingGenerator(calc);
  const monthly = Array(12).fill(300);
  const standardAnnual = (): number => calc.calculate(plans[0]!, monthly, "credit", "balanced").annualTotal;

  it("全プランを返す", () => {
    expect(generator.generate(plans, monthly, "credit", "balanced", standardAnnual())).toHaveLength(3);
  });

  it("年間合計の昇順に並び、順位は 1 から始まる", () => {
    const ranked = generator.generate(plans, monthly, "credit", "balanced", standardAnnual());
    const totals = ranked.map((r) => r.annualTotal);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(ranked[0]?.plan.plan_code).toBe("CHEAP");
  });

  it("標準プランとの差額は 標準額 - 年間合計", () => {
    const ranked = generator.generate(plans, monthly, "credit", "balanced", standardAnnual());
    const std = ranked.find((r) => r.plan.plan_code === "TEPCO_STD");
    expect(Math.abs(std?.savingVsStandard ?? 999)).toBeLessThan(1);
    expect(ranked[0]?.savingVsStandard).toBeGreaterThan(0);
  });
});

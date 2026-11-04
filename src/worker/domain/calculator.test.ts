import { describe, it, expect } from "vitest";
import { ElectricityCalculator } from "./calculator";
import type { PlanMaster } from "./types";
import { SETTINGS } from "../config/settings";

const standardPlan: PlanMaster = {
  id: 1,
  plan_code: "TEPCO_STD",
  company_name: "東京電力エナジーパートナー",
  plan_name: "従量電灯B（30A）",
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
  notes: null
};

const timeBasedPlan: PlanMaster = {
  ...standardPlan,
  id: 4,
  plan_code: "TEPCO_SMART",
  plan_name: "スマートライフS",
  base_fee: 1716,
  unit_price_1: 26.48,
  unit_price_2: 26.48,
  unit_price_3: 26.48,
  has_time_based: 1,
  night_discount_rate: 0.2
};

describe("ElectricityCalculator.calcTiered（段階料金）", () => {
  const calc = new ElectricityCalculator();

  it("第1段階のみ", () => {
    expect(calc.calcTiered(100, standardPlan)).toBeCloseTo(100 * 29.8, 6);
  });

  it("第1段階の上限を超える", () => {
    expect(calc.calcTiered(200, standardPlan)).toBeCloseTo(120 * 29.8 + 80 * 36.4, 6);
  });

  it("第2段階の上限を超える", () => {
    expect(calc.calcTiered(400, standardPlan)).toBeCloseTo(
      120 * 29.8 + 180 * 36.4 + 100 * 40.69,
      6
    );
  });

  it("0 kWh は 0 円", () => {
    expect(calc.calcTiered(0, standardPlan)).toBe(0);
  });
});

describe("時間帯割引・口座振替割引・再エネ賦課金", () => {
  const calc = new ElectricityCalculator();

  it("夜間在宅は時間帯割引が効く", () => {
    expect(calc.applyTimeBasedDiscount(1000, "evening", 0.2)).toBeCloseTo(800, 6);
  });

  it("昼間在宅は時間帯割引が効かない", () => {
    expect(calc.applyTimeBasedDiscount(1000, "morning", 0.2)).toBeCloseTo(1000, 6);
  });

  it("均等在宅は割引率を適用する", () => {
    expect(calc.applyTimeBasedDiscount(1000, "balanced", 0.3)).toBeCloseTo(700, 6);
  });

  it("口座振替は月額割引を年額から差し引く", () => {
    expect(calc.applyBankDiscount(120000, "bank", 55)).toBeCloseTo(120000 - 55 * 12, 6);
  });

  it("クレジットカード払いは割引なし", () => {
    expect(calc.applyBankDiscount(120000, "credit", 55)).toBeCloseTo(120000, 6);
  });

  it("再エネ賦課金フラグが 1 なら kWh に単価を掛けて加算する", () => {
    expect(calc.addRenewableSurcharge(100000, 3000, 1)).toBeCloseTo(
      100000 + 3000 * SETTINGS.renewableSurchargeRate,
      6
    );
  });

  it("再エネ賦課金フラグが 0 なら加算しない", () => {
    expect(calc.addRenewableSurcharge(100000, 3000, 0)).toBeCloseTo(100000, 6);
  });
});

describe("ElectricityCalculator.calculate（年間合計）", () => {
  const calc = new ElectricityCalculator();

  it("年間合計と月平均を返し、月平均は年間の 12 分の 1", () => {
    const result = calc.calculate(standardPlan, Array(12).fill(300), "credit", "balanced");
    expect(result.annualTotal).toBeGreaterThan(0);
    expect(result.monthlyAvg).toBeCloseTo(result.annualTotal / 12, 1);
    expect(result.annualKwh).toBeCloseTo(3600, 6);
  });

  it("再エネ賦課金を含む方が高くなる", () => {
    const withSurcharge = calc.calculate(standardPlan, Array(12).fill(100), "credit", "balanced");
    const withoutSurcharge = calc.calculate(
      { ...standardPlan, renewable_surcharge: 0 },
      Array(12).fill(100),
      "credit",
      "balanced"
    );
    expect(withSurcharge.annualTotal).toBeGreaterThan(withoutSurcharge.annualTotal);
  });

  it("時間帯別プランは昼間在宅なら割引が無い", () => {
    const morning = calc.calculate(timeBasedPlan, Array(12).fill(300), "credit", "morning");
    const evening = calc.calculate(timeBasedPlan, Array(12).fill(300), "credit", "evening");
    expect(evening.annualTotal).toBeLessThan(morning.annualTotal);
  });

  it("結果は小数第2位で丸める", () => {
    const result = calc.calculate(standardPlan, [123.456, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "credit", "balanced");
    expect(result.annualTotal).toBe(Number(result.annualTotal.toFixed(2)));
  });
});

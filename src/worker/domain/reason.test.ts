import { describe, it, expect } from "vitest";
import { ReasonGenerator } from "./reason";
import type { PlanMaster } from "./types";
import { REASON_TEMPLATES } from "../master/reasonTemplates";

const plainPlan: PlanMaster = {
  id: 1,
  plan_code: "PLAIN",
  company_name: "会社",
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
  bank_discount: 0,
  renewable_surcharge: 1,
  notes: null
};

const timeBasedPlan: PlanMaster = {
  ...plainPlan,
  id: 4,
  plan_code: "SMART",
  plan_name: "スマートライフS",
  has_time_based: 1,
  night_discount_rate: 0.2,
  bank_discount: 55
};

const generator = new ReasonGenerator(REASON_TEMPLATES);

describe("ReasonGenerator.checkUnsuitable（不向き判定）", () => {
  it("時間帯別プランで昼間在宅は不向き", () => {
    expect(generator.checkUnsuitable(timeBasedPlan, "morning")).toBe(true);
  });

  it("時間帯別プランでも夜間在宅なら不向きではない", () => {
    expect(generator.checkUnsuitable(timeBasedPlan, "evening")).toBe(false);
  });

  it("時間帯別でないプランは在宅パターンによらず不向きではない", () => {
    expect(generator.checkUnsuitable(plainPlan, "morning")).toBe(false);
    expect(generator.checkUnsuitable(plainPlan, "evening")).toBe(false);
  });
});

describe("ReasonGenerator.generate（推薦理由）", () => {
  it("不向きプランは不向きの定型文を返す", () => {
    expect(generator.generate(timeBasedPlan, "bank", "morning", 10000)).toBe(
      REASON_TEMPLATES.unsuitable_time_based
    );
  });

  it("高額の節約は金額入りの文面になる", () => {
    const reason = generator.generate(plainPlan, "credit", "balanced", 60000);
    expect(reason).toContain("節約");
    expect(reason).toContain("60000");
  });

  it("口座振替なら割引の文面を含む", () => {
    const withBank = { ...plainPlan, bank_discount: 55 };
    expect(generator.generate(withBank, "bank", "balanced", 1000)).toContain("口座振替");
  });

  it("夜間在宅の時間帯別プランは夜間割引の文面を含む", () => {
    expect(generator.generate(timeBasedPlan, "credit", "evening", 1000)).toContain("夜間");
  });

  it("節約が無く該当も無ければ標準の文面", () => {
    const expensive = { ...plainPlan, plan_name: "高いプラン", bank_discount: 0 };
    expect(generator.generate(expensive, "credit", "balanced", -5000)).toBe(REASON_TEMPLATES.standard);
  });

  it("グリーン・エコの名称は再エネの文面を含む", () => {
    const green = { ...plainPlan, plan_name: "グリーンプラン", bank_discount: 0 };
    expect(generator.generate(green, "credit", "balanced", -5000)).toBe(REASON_TEMPLATES.renewable);
  });
});

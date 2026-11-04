import type { ElectricityCalculator } from "./calculator";
import type { PaymentMethod, PlanMaster, StayPattern } from "./types";
import { roundTo2 } from "./rounding";

export interface RankingEntry {
  rank: number;
  plan: PlanMaster;
  annualTotal: number;
  monthlyAvg: number;
  savingVsStandard: number;
}

/** 全プランを年間電気代の昇順に並べ、標準プランとの節約額を付ける（SPEC F7）。 */
export class RankingGenerator {
  constructor(private readonly calculator: ElectricityCalculator) {}

  generate(
    plans: readonly PlanMaster[],
    monthlyKwh: readonly number[],
    paymentMethod: PaymentMethod,
    stayPattern: StayPattern,
    standardAnnual: number
  ): RankingEntry[] {
    const scored = plans.map((plan) => {
      const calc = this.calculator.calculate(plan, monthlyKwh, paymentMethod, stayPattern);
      return {
        plan,
        annualTotal: calc.annualTotal,
        monthlyAvg: calc.monthlyAvg,
        savingVsStandard: roundTo2(standardAnnual - calc.annualTotal)
      };
    });
    scored.sort((a, b) => a.annualTotal - b.annualTotal);
    return scored.map((entry, index) => ({ rank: index + 1, ...entry }));
  }
}

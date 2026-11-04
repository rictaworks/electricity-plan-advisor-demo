import { FLAG_ON, PAYMENT_METHOD, STAY_PATTERN } from "../config/domain";
import { SETTINGS } from "../config/settings";
import type { PaymentMethod, PlanMaster, StayPattern } from "./types";
import { roundTo2 } from "./rounding";

export interface AnnualCalculation {
  annualTotal: number;
  monthlyAvg: number;
  annualKwh: number;
}

/** 電気料金の計算（SPEC F6）。段階料金・時間帯割引・口座振替割引・再エネ賦課金の順に積算する。 */
export class ElectricityCalculator {
  calcTiered(kwh: number, plan: PlanMaster): number {
    if (kwh <= 0) {
      return 0;
    }
    const tier1 = Math.min(kwh, plan.threshold_1) * plan.unit_price_1;
    const tier2 = Math.max(0, Math.min(kwh, plan.threshold_2) - plan.threshold_1) * plan.unit_price_2;
    const tier3 = Math.max(0, kwh - plan.threshold_2) * plan.unit_price_3;
    return tier1 + tier2 + tier3;
  }

  applyTimeBasedDiscount(monthlyCost: number, stayPattern: StayPattern, discountRate: number): number {
    if (stayPattern !== STAY_PATTERN.MORNING) {
      return monthlyCost * (1 - discountRate);
    }
    return monthlyCost;
  }

  applyBankDiscount(annualCost: number, paymentMethod: PaymentMethod, bankDiscountPerMonth: number): number {
    if (paymentMethod === PAYMENT_METHOD.BANK) {
      return annualCost - bankDiscountPerMonth * SETTINGS.monthsPerYear;
    }
    return annualCost;
  }

  addRenewableSurcharge(annualCost: number, annualKwh: number, surchargeFlag: number): number {
    if (surchargeFlag === FLAG_ON) {
      return annualCost + annualKwh * SETTINGS.renewableSurchargeRate;
    }
    return annualCost;
  }

  calculate(
    plan: PlanMaster,
    monthlyKwh: readonly number[],
    paymentMethod: PaymentMethod,
    stayPattern: StayPattern
  ): AnnualCalculation {
    const monthlyCosts = monthlyKwh.map((kwh) => {
      let cost = plan.base_fee / SETTINGS.monthsPerYear + this.calcTiered(kwh, plan);
      if (plan.has_time_based === FLAG_ON && plan.night_discount_rate > 0) {
        cost = this.applyTimeBasedDiscount(cost, stayPattern, plan.night_discount_rate);
      }
      return cost;
    });

    const annualKwh = monthlyKwh.reduce((sum, kwh) => sum + kwh, 0);
    let annualTotal = monthlyCosts.reduce((sum, cost) => sum + cost, 0);
    annualTotal = this.applyBankDiscount(annualTotal, paymentMethod, plan.bank_discount);
    annualTotal = this.addRenewableSurcharge(annualTotal, annualKwh, plan.renewable_surcharge);

    const monthlyAvg = monthlyCosts.length > 0 ? annualTotal / SETTINGS.monthsPerYear : 0;
    return {
      annualTotal: roundTo2(annualTotal),
      monthlyAvg: roundTo2(monthlyAvg),
      annualKwh: roundTo2(annualKwh)
    };
  }
}

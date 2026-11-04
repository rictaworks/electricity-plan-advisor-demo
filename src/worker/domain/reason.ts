import { PAYMENT_METHOD, REASON_SEPARATOR, RENEWABLE_NAME_KEYWORDS, STAY_PATTERN, FLAG_ON } from "../config/domain";
import type { ReasonTemplates } from "../master/reasonTemplates";
import type { PaymentMethod, PlanMaster, StayPattern } from "./types";

/** 推薦理由の生成（SPEC F8：キーワードマッチによるルールベース）。 */
export class ReasonGenerator {
  constructor(private readonly templates: ReasonTemplates) {}

  checkUnsuitable(plan: PlanMaster, stayPattern: StayPattern): boolean {
    return plan.has_time_based === FLAG_ON && stayPattern === STAY_PATTERN.MORNING;
  }

  generate(plan: PlanMaster, paymentMethod: PaymentMethod, stayPattern: StayPattern, saving: number): string {
    if (this.checkUnsuitable(plan, stayPattern)) {
      return this.templates.unsuitable_time_based;
    }

    const reasons: string[] = [];
    if (saving >= this.templates.high_saving_threshold) {
      reasons.push(fillTemplate(this.templates.high_saving, { saving: Math.trunc(saving) }));
    } else if (saving > 0) {
      reasons.push(fillTemplate(this.templates.moderate_saving, { saving: Math.trunc(saving) }));
    }

    if (plan.has_time_based === FLAG_ON && (stayPattern === STAY_PATTERN.EVENING || stayPattern === STAY_PATTERN.BALANCED)) {
      reasons.push(this.templates.night_time_based);
    }

    if (plan.bank_discount > 0 && paymentMethod === PAYMENT_METHOD.BANK) {
      reasons.push(fillTemplate(this.templates.bank_discount, { discount: Math.trunc(plan.bank_discount) }));
    }

    if (RENEWABLE_NAME_KEYWORDS.some((keyword) => plan.plan_name.includes(keyword))) {
      reasons.push(this.templates.renewable);
    }

    if (reasons.length === 0) {
      reasons.push(this.templates.standard);
    }
    return reasons.join(REASON_SEPARATOR);
  }
}

function fillTemplate(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : placeholder
  );
}

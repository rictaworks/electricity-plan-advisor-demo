import type { PAYMENT_METHOD, STAY_PATTERN } from "../config/domain";

export type StayPattern = (typeof STAY_PATTERN)[keyof typeof STAY_PATTERN];
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

/** plan_master の 1 行（D1 の列名そのまま）。 */
export interface PlanMaster {
  id: number;
  plan_code: string;
  company_name: string;
  plan_name: string;
  region: string;
  ampere: number;
  base_fee: number;
  unit_price_1: number;
  threshold_1: number;
  unit_price_2: number;
  threshold_2: number;
  unit_price_3: number;
  has_time_based: number;
  night_discount_rate: number;
  bank_discount: number;
  renewable_surcharge: number;
  notes: string | null;
}

/** 12 か月分の使用量（実測値・推定値・採用値）。 */
export interface MonthlyUsageRow {
  year: number;
  month: number;
  kwhActual: number | null;
  kwhEstimated: number | null;
  kwhUsed: number;
}

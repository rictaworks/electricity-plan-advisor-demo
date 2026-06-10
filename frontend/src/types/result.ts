export interface RankedPlan {
  rank: number;
  plan_id: number;
  plan_code: string;
  company_name: string;
  plan_name: string;
  annual_total: number;
  monthly_avg: number;
  saving_vs_standard: number;
  recommendation_reason: string;
  is_unsuitable: boolean;
}

export interface SubmitResponse {
  session_id: string;
  ranking: RankedPlan[];
}

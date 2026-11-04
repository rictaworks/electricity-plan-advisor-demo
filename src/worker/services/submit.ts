import { SETTINGS } from "../config/settings";
import { MESSAGES } from "../config/messages";
import type { JoinedResultRow, ProfileRowInput, Repository, ResultRowInput } from "../db/repository";
import type { ElectricityCalculator } from "../domain/calculator";
import type { RankingGenerator } from "../domain/ranking";
import type { ReasonGenerator } from "../domain/reason";
import { roundTo2 } from "../domain/rounding";
import type { UsageEstimator, UsageRecordInput } from "../domain/usage";
import { AppError } from "../errors";
import type { MonthlyUsageInput, SubmitRequest } from "../validation/schemas";

/** API が返すランキング 1 件（応答の形は旧 FastAPI 版と同じ）。 */
export interface RankedPlanView {
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

export interface SubmitDependencies {
  repo: Repository;
  calculator: ElectricityCalculator;
  usage: UsageEstimator;
  ranking: RankingGenerator;
  reasons: ReasonGenerator;
}

/**
 * /api/submit の本体（旧 FastAPI 版 routers/submit.py の処理順をそのまま移植する）。
 * 世帯・使用量（12 か月）・ランキング結果を保存し、ランキングを返す。
 */
export class SubmitService {
  constructor(private readonly deps: SubmitDependencies) {}

  async submit(sessionId: string, body: SubmitRequest, now: Date): Promise<RankedPlanView[]> {
    const { repo, calculator, usage, ranking, reasons } = this.deps;

    const records: UsageRecordInput[] = body.usage_records.map((record) => ({
      year: record.year,
      month: record.month,
      kwhActual: actualKwh(record)
    }));
    const usageRows = usage.fillTwelveMonths(records, {
      year: body.usage_records[0]?.year ?? jstYear(now),
      memberCount: body.member_count,
      ageGroups: body.age_groups,
      stayHomePattern: body.stay_home_pattern
    });
    const monthlyKwh = usageRows.map((row) => row.kwhUsed);

    const plans = await repo.listPlans();
    if (plans.length === 0) {
      throw new AppError(500, MESSAGES.planMasterMissing);
    }
    const standardPlan = await repo.findPlanByCode(SETTINGS.standardPlanCode);
    if (!standardPlan) {
      throw new AppError(500, MESSAGES.standardPlanMissing);
    }

    const standardAnnual = calculator.calculate(
      standardPlan,
      monthlyKwh,
      body.payment_method,
      body.stay_home_pattern
    ).annualTotal;
    const entries = ranking.generate(plans, monthlyKwh, body.payment_method, body.stay_home_pattern, standardAnnual);

    const views: RankedPlanView[] = entries.map((entry) => ({
      rank: entry.rank,
      plan_id: entry.plan.id,
      plan_code: entry.plan.plan_code,
      company_name: entry.plan.company_name,
      plan_name: entry.plan.plan_name,
      annual_total: entry.annualTotal,
      monthly_avg: entry.monthlyAvg,
      saving_vs_standard: entry.savingVsStandard,
      recommendation_reason: reasons.generate(
        entry.plan,
        body.payment_method,
        body.stay_home_pattern,
        entry.savingVsStandard
      ),
      is_unsuitable: reasons.checkUnsuitable(entry.plan, body.stay_home_pattern)
    }));

    const profile: ProfileRowInput = {
      memberCount: body.member_count,
      ageGroupJson: JSON.stringify(body.age_groups),
      stayHomePattern: body.stay_home_pattern,
      paymentMethod: body.payment_method
    };
    const resultRows: ResultRowInput[] = views.map((view) => ({
      planId: view.plan_id,
      annualTotal: view.annual_total,
      monthlyAvg: view.monthly_avg,
      savingVsStandard: view.saving_vs_standard,
      recommendationReason: view.recommendation_reason,
      isUnsuitable: view.is_unsuitable
    }));
    await repo.replaceSubmission(sessionId, profile, usageRows, resultRows, now.toISOString());
    return views;
  }
}

/** 保存済みの結果（JOIN 済み）をランキングの応答形に変換する。 */
export function toRankedViews(rows: readonly JoinedResultRow[]): RankedPlanView[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    plan_id: row.plan_id,
    plan_code: row.plan_code,
    company_name: row.company_name,
    plan_name: row.plan_name,
    annual_total: row.annual_total,
    monthly_avg: row.monthly_avg,
    saving_vs_standard: row.saving_vs_standard,
    recommendation_reason: row.recommendation_reason,
    is_unsuitable: row.is_unsuitable !== 0
  }));
}

/** 円入力は旧実装と同じく概算換算（30 円 = 1 kWh）で kWh にする。kWh 入力があればそれを優先する。 */
function actualKwh(record: MonthlyUsageInput): number | null {
  if (record.kwh !== null && record.kwh !== undefined) {
    return record.kwh;
  }
  if (record.yen !== null && record.yen !== undefined) {
    return roundTo2(record.yen / SETTINGS.yenToKwhApproxRate);
  }
  return null;
}

function jstYear(now: Date): number {
  return new Date(now.getTime() + SETTINGS.jstOffsetHours * 60 * 60 * 1000).getUTCFullYear();
}

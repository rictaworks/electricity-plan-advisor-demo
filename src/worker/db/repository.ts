import type { PlanMaster, MonthlyUsageRow } from "../domain/types";

/** calculation_results の 1 行を保存するための値。 */
export interface ResultRowInput {
  planId: number;
  annualTotal: number;
  monthlyAvg: number;
  savingVsStandard: number;
  recommendationReason: string;
  isUnsuitable: boolean;
}

export interface ProfileRowInput {
  memberCount: number;
  ageGroupJson: string;
  stayHomePattern: string;
  paymentMethod: string;
}

/** 結果取得時に plan_master と結合した行。 */
export interface JoinedResultRow {
  plan_id: number;
  plan_code: string;
  company_name: string;
  plan_name: string;
  annual_total: number;
  monthly_avg: number;
  saving_vs_standard: number;
  recommendation_reason: string;
  is_unsuitable: number;
}

/**
 * D1 へのアクセスを集約する。全ての参照・更新は session_id を条件に含める（CLAUDE.md）。
 * 旧 FastAPI 版の SQLAlchemy 操作と同じ意味になるよう、書き込みは D1 の batch（1 トランザクション）で行う。
 */
export class Repository {
  constructor(private readonly db: D1Database) {}

  async sessionExists(sessionId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT session_id FROM sessions WHERE session_id = ?")
      .bind(sessionId)
      .first<{ session_id: string }>();
    return row !== null;
  }

  async createSession(sessionId: string, nowIso: string): Promise<void> {
    await this.db
      .prepare("INSERT INTO sessions (session_id, created_at, last_accessed_at) VALUES (?, ?, ?)")
      .bind(sessionId, nowIso, nowIso)
      .run();
  }

  async touchSession(sessionId: string, nowIso: string): Promise<void> {
    await this.db
      .prepare("UPDATE sessions SET last_accessed_at = ? WHERE session_id = ?")
      .bind(nowIso, sessionId)
      .run();
  }

  async listPlans(): Promise<PlanMaster[]> {
    const { results } = await this.db.prepare("SELECT * FROM plan_master ORDER BY id").all<PlanMaster>();
    return results;
  }

  async findPlanByCode(planCode: string): Promise<PlanMaster | null> {
    return this.db
      .prepare("SELECT * FROM plan_master WHERE plan_code = ?")
      .bind(planCode)
      .first<PlanMaster>();
  }

  /**
   * 提出内容を置き換える。旧セッションの世帯・使用量・結果を消してから、
   * 新しい世帯・12 か月の使用量・ランキング結果を 1 トランザクションで書き込む。
   */
  async replaceSubmission(
    sessionId: string,
    profile: ProfileRowInput,
    usage: readonly MonthlyUsageRow[],
    results: readonly ResultRowInput[],
    nowIso: string
  ): Promise<void> {
    const statements = [
      this.db.prepare("DELETE FROM calculation_results WHERE session_id = ?").bind(sessionId),
      this.db.prepare("DELETE FROM usage_records WHERE session_id = ?").bind(sessionId),
      this.db.prepare("DELETE FROM household_profiles WHERE session_id = ?").bind(sessionId),
      this.db
        .prepare(
          "INSERT INTO household_profiles (session_id, member_count, age_group_json, stay_home_pattern, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(
          sessionId,
          profile.memberCount,
          profile.ageGroupJson,
          profile.stayHomePattern,
          profile.paymentMethod,
          nowIso
        ),
      ...usage.map((row) =>
        this.db
          .prepare(
            "INSERT INTO usage_records (session_id, year, month, kwh_actual, kwh_estimated, kwh_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(sessionId, row.year, row.month, row.kwhActual, row.kwhEstimated, row.kwhUsed, nowIso)
      ),
      ...results.map((row) =>
        this.db
          .prepare(
            "INSERT INTO calculation_results (session_id, plan_id, annual_total, monthly_avg, saving_vs_standard, recommendation_reason, is_unsuitable, calculated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            sessionId,
            row.planId,
            row.annualTotal,
            row.monthlyAvg,
            row.savingVsStandard,
            row.recommendationReason,
            row.isUnsuitable ? 1 : 0,
            nowIso
          )
      )
    ];
    await this.db.batch(statements);
  }

  async listResults(sessionId: string): Promise<JoinedResultRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT p.id AS plan_id, p.plan_code, p.company_name, p.plan_name,
                r.annual_total, r.monthly_avg, r.saving_vs_standard,
                r.recommendation_reason, r.is_unsuitable
           FROM calculation_results r
           JOIN plan_master p ON p.id = r.plan_id
          WHERE r.session_id = ?
          ORDER BY r.annual_total, p.id`
      )
      .bind(sessionId)
      .all<JoinedResultRow>();
    return results;
  }

  /** 日次リセット・手動リセット：全セッションと関連データを削除し、削除したセッション数を返す。 */
  async purgeAll(): Promise<number> {
    const [countResult] = await this.db.batch([
      this.db.prepare("SELECT COUNT(*) AS n FROM sessions"),
      this.db.prepare("DELETE FROM calculation_results"),
      this.db.prepare("DELETE FROM usage_records"),
      this.db.prepare("DELETE FROM household_profiles"),
      this.db.prepare("DELETE FROM sessions")
    ]);
    const row = countResult?.results[0] as { n: number } | undefined;
    return row?.n ?? 0;
  }
}

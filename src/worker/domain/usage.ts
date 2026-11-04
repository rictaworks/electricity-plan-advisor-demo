import { SETTINGS } from "../config/settings";
import { AGE_COEFFICIENTS, HOUSEHOLD_PROFILES, SEASON_COEFFICIENTS } from "../master/usageMasters";
import type { MonthlyUsageRow, StayPattern } from "./types";
import { roundTo2 } from "./rounding";

export interface UsageRecordInput {
  year: number;
  month: number;
  kwhActual: number | null;
}

export interface HouseholdUsageContext {
  /** 入力が無い月に使う年（通常は入力の年、無ければ現在の JST の年）。 */
  year: number;
  memberCount: number;
  ageGroups: readonly string[];
  stayHomePattern: StayPattern;
}

/**
 * 未入力月の使用量を推定する（SPEC F4：世帯プロファイル・年齢層係数・季節補正）。
 * 旧 FastAPI 版は「入力された行」だけを推定していたため、未入力の月が計算から抜けていた。
 * SPEC 1.3 F4 と画面の「未入力の月は自動推定されます」に合わせ、12 か月すべてを埋める。
 */
export class UsageEstimator {
  private readonly ageCoefficients = new Map(AGE_COEFFICIENTS.map((row) => [row.age_group, row.coefficient]));
  private readonly seasonCoefficients = new Map(SEASON_COEFFICIENTS.map((row) => [row.month, row.coefficient]));
  private readonly profileBaseKwh = new Map(
    HOUSEHOLD_PROFILES.map((row) => [profileKey(row.member_count, row.stay_home_pattern), row.base_kwh_monthly])
  );

  estimateMonth(memberCount: number, ageGroups: readonly string[], stayPattern: StayPattern, month: number): number {
    const base = this.baseKwh(memberCount, stayPattern);
    const ageCoefficient = this.ageCoefficient(ageGroups);
    const seasonCoefficient = this.seasonCoefficients.get(month) ?? SETTINGS.defaultCoefficient;
    return roundTo2(base * ageCoefficient * seasonCoefficient);
  }

  fillTwelveMonths(records: readonly UsageRecordInput[], context: HouseholdUsageContext): MonthlyUsageRow[] {
    const provided = new Map<number, UsageRecordInput>();
    for (const record of records) {
      if (record.kwhActual !== null) {
        provided.set(record.month, record);
      }
    }

    return Array.from({ length: SETTINGS.monthsPerYear }, (_, index) => {
      const month = index + 1;
      const record = provided.get(month);
      if (record && record.kwhActual !== null) {
        return { year: record.year, month, kwhActual: record.kwhActual, kwhEstimated: null, kwhUsed: record.kwhActual };
      }
      const estimated = this.estimateMonth(context.memberCount, context.ageGroups, context.stayHomePattern, month);
      return { year: context.year, month, kwhActual: null, kwhEstimated: estimated, kwhUsed: estimated };
    });
  }

  private baseKwh(memberCount: number, stayPattern: StayPattern): number {
    const tableMax = SETTINGS.profileTableMaxMembers;
    const tableMembers = Math.min(memberCount, tableMax);
    const base = this.profileBaseKwh.get(profileKey(tableMembers, stayPattern));
    if (base === undefined) {
      throw new Error(`household profile not found: members=${tableMembers} pattern=${stayPattern}`);
    }
    if (memberCount <= tableMax) {
      return base;
    }
    return base + (memberCount - tableMax) * SETTINGS.extraKwhPerPerson;
  }

  private ageCoefficient(ageGroups: readonly string[]): number {
    if (ageGroups.length === 0) {
      return SETTINGS.defaultCoefficient;
    }
    const sum = ageGroups.reduce(
      (total, group) => total + (this.ageCoefficients.get(group) ?? SETTINGS.defaultCoefficient),
      0
    );
    return sum / ageGroups.length;
  }
}

function profileKey(memberCount: number, stayPattern: string): string {
  return `${memberCount}:${stayPattern}`;
}

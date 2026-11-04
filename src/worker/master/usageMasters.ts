import ageCoefficientsJson from "./seed/age_coefficients.json";
import seasonCoefficientsJson from "./seed/season_coefficients.json";
import householdProfilesJson from "./seed/household_profiles.json";

/**
 * 使用量推定のマスタ（SPEC 1.4）。旧 FastAPI 版と同じ JSON をそのまま読む。
 * 件数：年齢層係数 6 件・季節補正 12 件・世帯プロファイル 18 件。
 */

export interface AgeCoefficientRow {
  age_group: string;
  coefficient: number;
}

export interface SeasonCoefficientRow {
  month: number;
  coefficient: number;
}

export interface HouseholdProfileRow {
  member_count: number;
  stay_home_pattern: string;
  base_kwh_monthly: number;
}

export const AGE_COEFFICIENTS: readonly AgeCoefficientRow[] = ageCoefficientsJson;
export const SEASON_COEFFICIENTS: readonly SeasonCoefficientRow[] = seasonCoefficientsJson;
export const HOUSEHOLD_PROFILES: readonly HouseholdProfileRow[] = householdProfilesJson;

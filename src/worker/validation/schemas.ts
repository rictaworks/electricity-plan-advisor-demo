import { z } from "zod";
import { PAYMENT_METHODS, STAY_PATTERNS } from "../config/domain";
import { SETTINGS } from "../config/settings";

/**
 * /api/submit の入力検証。旧 FastAPI 版（pydantic）の制約を移植する。
 * 円の入力は旧実装で負の値が通っていたため、0 以上に制限する（フロントの validateYen と同じ）。
 */
const MonthlyUsageSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  kwh: z.number().min(SETTINGS.minKwh).max(SETTINGS.maxKwh).nullish(),
  yen: z.number().min(0).max(SETTINGS.maxYen).nullish()
});

export type MonthlyUsageInput = z.infer<typeof MonthlyUsageSchema>;

export const SubmitRequestSchema = z.object({
  hp_field: z.string().default(""),
  member_count: z.number().int().min(SETTINGS.minMemberCount).max(SETTINGS.maxMemberCount),
  age_groups: z.array(z.string().max(SETTINGS.maxAgeGroupLength)).max(SETTINGS.maxMemberCount),
  stay_home_pattern: z.enum(STAY_PATTERNS),
  payment_method: z.enum(PAYMENT_METHODS),
  usage_records: z.array(MonthlyUsageSchema).max(SETTINGS.monthsPerYear)
});

export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;

export function parseSubmitRequest(raw: unknown) {
  return SubmitRequestSchema.safeParse(raw);
}

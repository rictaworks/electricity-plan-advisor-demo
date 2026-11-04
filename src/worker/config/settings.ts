/**
 * 数値・規則の設定値。旧 FastAPI 版 backend/app/config.py の値をそのまま移植する。
 * 値を変える場合はここだけを直す（ハードコード禁止）。
 */
export const SETTINGS = {
  sessionCookieName: "session_id",
  sessionTtlSeconds: 24 * 60 * 60,
  uuidV4Pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  renewableSurchargeRate: 3.49,
  standardPlanCode: "TEPCO_STD",
  yenToKwhApproxRate: 30,
  minMemberCount: 1,
  maxMemberCount: 8,
  minKwh: 0,
  maxKwh: 10000,
  maxAgeGroupLength: 32,
  maxYen: 300000,
  adminTokenHeader: "x-admin-token",
  sessionCookieSecure: true,
  monthsPerYear: 12,
  profileTableMaxMembers: 6,
  extraKwhPerPerson: 65,
  defaultCoefficient: 1,
  jstOffsetHours: 9
} as const;

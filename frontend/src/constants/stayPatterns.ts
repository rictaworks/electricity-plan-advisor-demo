export const STAY_PATTERNS = [
  { value: "morning", label: "昼間在宅（日中が多い）" },
  { value: "evening", label: "夜間在宅（夜が多い）" },
  { value: "balanced", label: "均等（昼夜バランス）" },
] as const;

export type StayPattern = "morning" | "evening" | "balanced";

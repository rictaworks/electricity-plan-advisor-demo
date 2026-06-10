export const AGE_GROUPS = [
  "10代",
  "20代",
  "30代",
  "40代",
  "50代",
  "60代以上",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

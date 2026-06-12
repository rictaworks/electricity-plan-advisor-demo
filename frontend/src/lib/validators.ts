const MIN_KWH = 0;
const MAX_KWH = 10000;
const MIN_MEMBER = 1;
const MAX_MEMBER = 8;

export function validateKwh(value: number | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (isNaN(value)) return "数値を入力してください";
  if (value < MIN_KWH) return `${MIN_KWH}以上の値を入力してください`;
  if (value > MAX_KWH) return `${MAX_KWH}以下の値を入力してください`;
  return null;
}

export function validateMemberCount(value: number): string | null {
  if (!Number.isInteger(value)) return "整数を入力してください";
  if (value < MIN_MEMBER) return `${MIN_MEMBER}人以上を選択してください`;
  if (value > MAX_MEMBER) return `${MAX_MEMBER}人以下を選択してください`;
  return null;
}

export function validateAgeGroups(groups: string[], memberCount: number): string | null {
  if (groups.length !== memberCount) {
    return `世帯人数（${memberCount}人）分の年齢層を選択してください`;
  }
  if (groups.some((g) => !g)) {
    return "全メンバーの年齢層を選択してください";
  }
  return null;
}

export function validateYen(value: number | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (isNaN(value)) return "数値を入力してください";
  if (value < 0) return "0以上の値を入力してください";
  return null;
}

/**
 * 管理用リセットの可否。
 * - 期待するトークン（Worker secret）が未設定なら、API 自体を無効にする（disabled）。
 * - トークンが無い・違うなら unauthorized。比較は定時間（先頭から一致を探さない）で行う。
 */
export type AdminAccess = "disabled" | "unauthorized" | "granted";

export function evaluateAdminAccess(expected: string | undefined, provided: string | undefined): AdminAccess {
  if (expected === undefined || expected === "") {
    return "disabled";
  }
  if (provided === undefined || !constantTimeEquals(provided, expected)) {
    return "unauthorized";
  }
  return "granted";
}

export function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let i = 0; i < length; i++) {
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return difference === 0;
}

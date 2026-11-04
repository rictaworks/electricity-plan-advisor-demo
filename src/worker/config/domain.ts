/** 業務上の識別子・列挙値・推薦理由に使う語。旧 FastAPI 版の文字列をそのまま移植する。 */

export const STAY_PATTERN = {
  MORNING: "morning",
  EVENING: "evening",
  BALANCED: "balanced"
} as const;

export const STAY_PATTERNS = [STAY_PATTERN.MORNING, STAY_PATTERN.EVENING, STAY_PATTERN.BALANCED] as const;

export const PAYMENT_METHOD = {
  BANK: "bank",
  CREDIT: "credit"
} as const;

export const PAYMENT_METHODS = [PAYMENT_METHOD.BANK, PAYMENT_METHOD.CREDIT] as const;

/** 真偽フラグ（DB の INTEGER 列）。 */
export const FLAG_ON = 1;

/** 再エネ系プランの判定に使うプラン名の語。 */
export const RENEWABLE_NAME_KEYWORDS = ["グリーン", "エコ"] as const;

/** 推薦理由を連結する区切り（全角スラッシュ）。 */
export const REASON_SEPARATOR = "／";

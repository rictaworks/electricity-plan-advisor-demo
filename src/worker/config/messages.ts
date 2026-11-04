/** API が返すメッセージと、ログの文言。 */

export const MESSAGES = {
  validationFailed: "入力内容に誤りがあります",
  sessionNotFound: "セッションが見つかりません",
  resultNotFound: "結果が見つかりません",
  routeNotFound: "指定された API は存在しません",
  unauthorized: "管理トークンが正しくありません",
  planMasterMissing: "プランマスタが登録されていません",
  standardPlanMissing: "標準プランのマスタが見つかりません",
  internalError: "サーバー内部でエラーが発生しました",
  resetComplete: "reset complete"
} as const;

export const LOG_MESSAGES = {
  honeypotTriggered: "Honeypot triggered: submission ignored",
  sessionIssued: "New session issued",
  submitSaved: "Saved ranking results",
  dailyResetDone: "Daily reset: sessions removed",
  manualResetDone: "Manual reset: sessions removed",
  resetFailed: "Daily reset failed"
} as const;

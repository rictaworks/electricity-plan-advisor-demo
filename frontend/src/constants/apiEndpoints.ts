/**
 * API の位置。フロントは Worker と同一オリジンで配信されるため、相対パスで呼ぶ（CORS 不要）。
 * 旧 FastAPI 版は NEXT_PUBLIC_API_URL（別オリジン）を使っていたが、Workers 移行で廃止した。
 */
const API_BASE = "";

export const API_ENDPOINTS = {
  SESSION: `${API_BASE}/api/session`,
  SUBMIT: `${API_BASE}/api/submit`,
  RESULT: (sessionId: string) => `${API_BASE}/api/result/${sessionId}`,
  ADMIN_RESET: `${API_BASE}/api/admin/reset`,
  HEALTH: `${API_BASE}/api/health`,
} as const;

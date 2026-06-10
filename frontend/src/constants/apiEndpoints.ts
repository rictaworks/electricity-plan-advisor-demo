const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  SESSION: `${API_BASE}/api/session`,
  SUBMIT: `${API_BASE}/api/submit`,
  RESULT: (sessionId: string) => `${API_BASE}/api/result/${sessionId}`,
  ADMIN_RESET: `${API_BASE}/api/admin/reset`,
  HEALTH: `${API_BASE}/api/health`,
} as const;

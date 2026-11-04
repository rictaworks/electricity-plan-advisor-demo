import { SETTINGS } from "../config/settings";

/** セッションの保存先（D1 の sessions 表）に対する操作。テストでは差し替え可能にする。 */
export interface SessionStore {
  exists(sessionId: string): Promise<boolean>;
  create(sessionId: string, nowIso: string): Promise<void>;
  touch(sessionId: string, nowIso: string): Promise<void>;
}

/** UUID v4 の形式か検証する（SPEC 1.7：不正な場合は新規発行）。 */
export function validateUuidV4(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return SETTINGS.uuidV4Pattern.test(value);
}

/**
 * Cookie の session_id が既存セッションなら延長して返し、
 * 無い・不正・失効（DB リセット後）の場合は新規に発行する。
 */
export async function resolveSessionId(
  cookieValue: string | null | undefined,
  store: SessionStore,
  now: Date,
  newId: () => string
): Promise<string> {
  if (validateUuidV4(cookieValue) && cookieValue && (await store.exists(cookieValue))) {
    await store.touch(cookieValue, now.toISOString());
    return cookieValue;
  }
  const sessionId = newId();
  await store.create(sessionId, now.toISOString());
  return sessionId;
}

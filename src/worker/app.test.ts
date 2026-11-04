import { describe, it, expect } from "vitest";
import { createApp } from "./app";
import { createSqliteD1 } from "./testing/sqliteD1";
import type { Env } from "./env";
import worker from "./index";

/** 統合テスト：Hono アプリ全体を、migrations を適用した SQLite（D1 互換）上で動かす。 */

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ADMIN_TOKEN = "test-admin-token-0123456789";

function setup(extraEnv: Partial<Env> = {}) {
  const { d1, raw } = createSqliteD1();
  const env = { DB: d1, ...extraEnv } as unknown as Env;
  const app = createApp();
  const call = async (path: string, init?: RequestInit): Promise<Response> => app.request(path, init, env);
  return { env, raw, call };
}

function fullPayload(overrides: Record<string, unknown> = {}) {
  return {
    hp_field: "",
    member_count: 4,
    age_groups: ["30代", "30代", "10代", "10代"],
    stay_home_pattern: "balanced",
    payment_method: "bank",
    usage_records: Array.from({ length: 12 }, (_, i) => ({ year: 2025, month: i + 1, kwh: 300 })),
    ...overrides
  };
}

function postSubmit(call: (p: string, i?: RequestInit) => Promise<Response>, body: unknown, cookie?: string) {
  return call("/api/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie: `session_id=${cookie}` } : {})
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

async function submitAndGetSession(call: (p: string, i?: RequestInit) => Promise<Response>): Promise<string> {
  const res = await postSubmit(call, fullPayload());
  return ((await res.json()) as { session_id: string }).session_id;
}

function sessionCookieFrom(res: Response): string {
  const header = res.headers.get("set-cookie") ?? "";
  const match = /session_id=([^;]+)/.exec(header);
  return match?.[1] ?? "";
}

function resultRequest(call: (p: string, i?: RequestInit) => Promise<Response>, sid: string, cookie?: string) {
  return call(`/api/result/${sid}`, cookie ? { headers: { cookie: `session_id=${cookie}` } } : undefined);
}

describe("GET /api/session・GET /api/health", () => {
  it("新規セッションを発行し、HttpOnly・Secure・SameSite=Lax の Cookie を返す", async () => {
    const { call } = setup();
    const res = await call("/api/session");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { session_id: string };
    expect(body.session_id).toMatch(UUID_V4);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`session_id=${body.session_id}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");
  });

  it("APP_ENV が development でも Secure は付く（常時有効）", async () => {
    const { call } = setup({ APP_ENV: "development" });
    const res = await call("/api/session");
    expect(res.headers.get("set-cookie")).toContain("Secure");
  });

  it("既存の Cookie があれば同じセッションを返す", async () => {
    const { call } = setup();
    const first = await call("/api/session");
    const { session_id: sid } = (await first.json()) as { session_id: string };
    const second = await call("/api/session", { headers: { cookie: `session_id=${sid}` } });
    const body = (await second.json()) as { session_id: string };
    expect(body.session_id).toBe(sid);
  });

  it("不正な Cookie の値は無視して新規発行する", async () => {
    const { call } = setup();
    const res = await call("/api/session", { headers: { cookie: "session_id=not-a-uuid" } });
    const body = (await res.json()) as { session_id: string };
    expect(body.session_id).toMatch(UUID_V4);
    expect(body.session_id).not.toBe("not-a-uuid");
  });

  it("health は ok を返す", async () => {
    const { call } = setup();
    const res = await call("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("POST /api/submit", () => {
  it("12 か月分の入力で 20 プランのランキングを返す", async () => {
    const { call } = setup();
    const res = await postSubmit(call, fullPayload());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { session_id: string; ranking: Array<Record<string, unknown>> };
    expect(body.session_id).toMatch(UUID_V4);
    expect(body.ranking).toHaveLength(20);
    const required = [
      "rank",
      "plan_id",
      "plan_code",
      "company_name",
      "plan_name",
      "annual_total",
      "monthly_avg",
      "saving_vs_standard",
      "recommendation_reason",
      "is_unsuitable"
    ];
    for (const key of required) {
      expect(body.ranking[0]).toHaveProperty(key);
    }
  });

  it("ランキングは年間合計の昇順", async () => {
    const { call } = setup();
    const body = (await (await postSubmit(call, fullPayload())).json()) as {
      ranking: Array<{ annual_total: number }>;
    };
    const totals = body.ranking.map((r) => r.annual_total);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });

  it("入力のない月は推定され、12 か月分の使用量が保存される", async () => {
    const { call, raw } = setup();
    const payload = fullPayload({ usage_records: [{ year: 2025, month: 1, kwh: 400 }] });
    const res = await postSubmit(call, payload);
    expect(res.status).toBe(200);
    const { session_id: sid } = (await res.json()) as { session_id: string };

    const rows = raw
      .prepare("SELECT month, kwh_actual, kwh_estimated, kwh_used FROM usage_records WHERE session_id = ? ORDER BY month")
      .all(sid) as Array<{ month: number; kwh_actual: number | null; kwh_estimated: number | null; kwh_used: number }>;
    expect(rows).toHaveLength(12);
    expect(rows[0]).toMatchObject({ month: 1, kwh_actual: 400, kwh_estimated: null, kwh_used: 400 });
    expect(rows[1]?.kwh_actual).toBeNull();
    expect(rows[1]?.kwh_used).toBeGreaterThan(0);
  });

  it("入力が無くても 12 か月推定してランキングを返す（旧実装は年間合計が 0 になっていた）", async () => {
    const { call } = setup();
    const res = await postSubmit(call, fullPayload({ usage_records: [] }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ranking: Array<{ annual_total: number }> };
    expect(body.ranking).toHaveLength(20);
    expect(body.ranking.every((r) => r.annual_total > 0)).toBe(true);
  });

  it("ハニーポットに値があれば空のランキングを返し、セッションを作らない", async () => {
    const { call, raw } = setup();
    const before = (raw.prepare("SELECT COUNT(*) AS n FROM sessions").get() as { n: number }).n;
    const res = await postSubmit(call, fullPayload({ hp_field: "bot_value" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ session_id: "", ranking: [] });
    const after = (raw.prepare("SELECT COUNT(*) AS n FROM sessions").get() as { n: number }).n;
    expect(after).toBe(before);
  });

  it("世帯人数 9 人は 422", async () => {
    const { call } = setup();
    expect((await postSubmit(call, fullPayload({ member_count: 9 }))).status).toBe(422);
  });

  it("負の kWh は 422", async () => {
    const { call } = setup();
    const res = await postSubmit(call, fullPayload({ usage_records: [{ year: 2025, month: 1, kwh: -1 }] }));
    expect(res.status).toBe(422);
  });

  it("負の円は 422", async () => {
    const { call } = setup();
    const res = await postSubmit(call, fullPayload({ usage_records: [{ year: 2025, month: 1, yen: -100 }] }));
    expect(res.status).toBe(422);
  });

  it("円の上限（300000）を超えると 422", async () => {
    const { call } = setup();
    const res = await postSubmit(call, fullPayload({ usage_records: [{ year: 2025, month: 1, yen: 300001 }] }));
    expect(res.status).toBe(422);
  });

  it("使用量の件数が 12 を超えると 422", async () => {
    const { call } = setup();
    const records = Array.from({ length: 13 }, (_, i) => ({ year: 2025, month: (i % 12) + 1, kwh: 300 }));
    expect((await postSubmit(call, fullPayload({ usage_records: records }))).status).toBe(422);
  });

  it("JSON として不正な本文は 422", async () => {
    const { call } = setup();
    expect((await postSubmit(call, "{not json")).status).toBe(422);
  });

  it("既存の Cookie があれば同じセッションで上書き保存する", async () => {
    const { call, raw } = setup();
    const first = await postSubmit(call, fullPayload());
    const sid = ((await first.json()) as { session_id: string }).session_id;
    const second = await postSubmit(call, fullPayload({ payment_method: "credit" }), sid);
    expect(((await second.json()) as { session_id: string }).session_id).toBe(sid);
    const count = raw.prepare("SELECT COUNT(*) AS n FROM household_profiles WHERE session_id = ?").get(sid) as {
      n: number;
    };
    expect(count.n).toBe(1);
    expect(sessionCookieFrom(second)).toBe(sid);
  });
});

describe("GET /api/result/:sessionId（本人の Cookie と一致するときだけ返す）", () => {
  it("同じ Cookie を持つ本人なら 20 件返す", async () => {
    const { call } = setup();
    const sid = await submitAndGetSession(call);
    const res = await resultRequest(call, sid, sid);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { session_id: string; ranking: unknown[] };
    expect(body.session_id).toBe(sid);
    expect(body.ranking).toHaveLength(20);
  });

  it("Cookie が無ければ 404（ID を知っていても読めない）", async () => {
    const { call } = setup();
    const sid = await submitAndGetSession(call);
    expect((await resultRequest(call, sid)).status).toBe(404);
  });

  it("別セッションの Cookie では 404", async () => {
    const { call } = setup();
    const sidA = await submitAndGetSession(call);
    const sidB = await submitAndGetSession(call);
    expect((await resultRequest(call, sidA, sidB)).status).toBe(404);
  });

  it("形式の不正な ID は 404", async () => {
    const { call } = setup();
    expect((await resultRequest(call, "not-a-uuid", "not-a-uuid")).status).toBe(404);
  });

  it("結果の無い UUID は 404", async () => {
    const { call } = setup();
    const sid = crypto.randomUUID();
    expect((await resultRequest(call, sid, sid)).status).toBe(404);
  });
});

describe("POST /api/admin/reset（管理トークン必須）", () => {
  it("ADMIN_RESET_TOKEN が未設定なら、このエンドポイントは無効（404）", async () => {
    const { call } = setup();
    const res = await call("/api/admin/reset", { method: "POST", headers: { "x-admin-token": "anything" } });
    expect(res.status).toBe(404);
  });

  it("トークンを送らなければ 401", async () => {
    const { call } = setup({ ADMIN_RESET_TOKEN: ADMIN_TOKEN });
    expect((await call("/api/admin/reset", { method: "POST" })).status).toBe(401);
  });

  it("誤ったトークンは 401 で、データは消えない", async () => {
    const { call, raw } = setup({ ADMIN_RESET_TOKEN: ADMIN_TOKEN });
    await submitAndGetSession(call);
    const res = await call("/api/admin/reset", { method: "POST", headers: { "x-admin-token": "wrong" } });
    expect(res.status).toBe(401);
    const left = raw.prepare("SELECT COUNT(*) AS n FROM sessions").get() as { n: number };
    expect(left.n).toBeGreaterThan(0);
  });

  it("正しいトークンなら全セッションを削除し、件数を返す", async () => {
    const { call, raw } = setup({ ADMIN_RESET_TOKEN: ADMIN_TOKEN });
    await submitAndGetSession(call);
    await submitAndGetSession(call);
    const res = await call("/api/admin/reset", { method: "POST", headers: { "x-admin-token": ADMIN_TOKEN } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ message: "reset complete", deleted_sessions: 2 });
    const left = raw.prepare("SELECT COUNT(*) AS n FROM calculation_results").get() as { n: number };
    expect(left.n).toBe(0);
  });

  it("リセット後は結果が 404 になる", async () => {
    const { call } = setup({ ADMIN_RESET_TOKEN: ADMIN_TOKEN });
    const sid = await submitAndGetSession(call);
    await call("/api/admin/reset", { method: "POST", headers: { "x-admin-token": ADMIN_TOKEN } });
    expect((await resultRequest(call, sid, sid)).status).toBe(404);
  });
});

describe("Cron の日次リセット（JST 03:00）", () => {
  it("scheduled ハンドラは全データを削除する（トークンは不要）", async () => {
    const { env, call } = setup();
    const sid = await submitAndGetSession(call);
    const pending: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException: () => {} };
    await worker.scheduled({} as ScheduledController, env, ctx as unknown as ExecutionContext);
    await Promise.all(pending);
    expect((await resultRequest(call, sid, sid)).status).toBe(404);
  });
});

describe("未定義の API パス", () => {
  it("存在しない /api/* は 404 を返す", async () => {
    const { call } = setup();
    expect((await call("/api/unknown")).status).toBe(404);
  });
});

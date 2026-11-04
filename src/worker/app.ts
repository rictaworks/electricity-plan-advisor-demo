import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { SETTINGS } from "./config/settings";
import { LOG_MESSAGES, MESSAGES } from "./config/messages";
import { AppError } from "./errors";
import type { Env } from "./env";
import { Repository } from "./db/repository";
import { ElectricityCalculator } from "./domain/calculator";
import { RankingGenerator } from "./domain/ranking";
import { ReasonGenerator } from "./domain/reason";
import { constantTimeEquals, evaluateAdminAccess } from "./domain/adminAuth";
import { resolveSessionId, validateUuidV4 } from "./domain/session";
import { UsageEstimator } from "./domain/usage";
import { REASON_TEMPLATES } from "./master/reasonTemplates";
import { parseSubmitRequest } from "./validation/schemas";
import { SubmitService, toRankedViews } from "./services/submit";

type AppContext = Context<{ Bindings: Env }>;

/** Hono アプリ本体。Worker の fetch から呼ばれ、テストでは app.request で直接呼ぶ。 */
export function createApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  const calculator = new ElectricityCalculator();
  const domainServices = {
    calculator,
    usage: new UsageEstimator(),
    ranking: new RankingGenerator(calculator),
    reasons: new ReasonGenerator(REASON_TEMPLATES)
  };

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json({ detail: error.message }, error.status);
    }
    console.error("Unhandled error", error);
    return c.json({ detail: MESSAGES.internalError }, 500);
  });

  app.notFound((c) => c.json({ detail: MESSAGES.routeNotFound }, 404));

  app.get("/api/health", (c) => c.json({ status: "ok" }));

  app.get("/api/session", async (c) => {
    const sessionId = await resolveFromCookie(c);
    issueSessionCookie(c, sessionId);
    return c.json({ session_id: sessionId });
  });

  app.post("/api/submit", async (c) => {
    const raw: unknown = await c.req.json().catch(() => undefined);
    const parsed = parseSubmitRequest(raw);
    if (!parsed.success) {
      return c.json(
        {
          detail: MESSAGES.validationFailed,
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
        },
        422
      );
    }

    const body = parsed.data;
    if (body.hp_field !== "") {
      console.warn(LOG_MESSAGES.honeypotTriggered);
      return c.json({ session_id: "", ranking: [] }, 200);
    }

    const sessionId = await resolveFromCookie(c);
    issueSessionCookie(c, sessionId);
    const service = new SubmitService({ ...domainServices, repo: new Repository(c.env.DB) });
    const ranking = await service.submit(sessionId, body, new Date());
    return c.json({ session_id: sessionId, ranking });
  });

  // 結果は「その Cookie の持ち主」にだけ返す。ID を知っているだけでは読めない。
  app.get("/api/result/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");
    if (!validateUuidV4(sessionId)) {
      throw new AppError(404, MESSAGES.sessionNotFound);
    }
    const cookie = getCookie(c, SETTINGS.sessionCookieName);
    if (!cookie || !constantTimeEquals(cookie, sessionId)) {
      throw new AppError(404, MESSAGES.resultNotFound);
    }
    const rows = await new Repository(c.env.DB).listResults(sessionId);
    if (rows.length === 0) {
      throw new AppError(404, MESSAGES.resultNotFound);
    }
    return c.json({ session_id: sessionId, ranking: toRankedViews(rows) });
  });

  // 全データを消す管理用操作。トークン未設定なら API ごと無効（404）、違うなら 401。
  app.post("/api/admin/reset", async (c) => {
    const access = evaluateAdminAccess(c.env.ADMIN_RESET_TOKEN, c.req.header(SETTINGS.adminTokenHeader));
    if (access === "disabled") {
      throw new AppError(404, MESSAGES.routeNotFound);
    }
    if (access === "unauthorized") {
      throw new AppError(401, MESSAGES.unauthorized);
    }
    const deleted = await new Repository(c.env.DB).purgeAll();
    console.info(LOG_MESSAGES.manualResetDone);
    return c.json({ message: MESSAGES.resetComplete, deleted_sessions: deleted });
  });

  return app;
}

async function resolveFromCookie(c: AppContext): Promise<string> {
  const repo = new Repository(c.env.DB);
  const cookie = getCookie(c, SETTINGS.sessionCookieName);
  return resolveSessionId(
    cookie,
    {
      exists: (sessionId) => repo.sessionExists(sessionId),
      create: (sessionId, nowIso) => repo.createSession(sessionId, nowIso),
      touch: (sessionId, nowIso) => repo.touchSession(sessionId, nowIso)
    },
    new Date(),
    () => crypto.randomUUID()
  );
}

function issueSessionCookie(c: AppContext, sessionId: string): void {
  setCookie(c, SETTINGS.sessionCookieName, sessionId, {
    httpOnly: true,
    secure: SETTINGS.sessionCookieSecure,
    sameSite: "Lax",
    path: "/",
    maxAge: SETTINGS.sessionTtlSeconds
  });
}

import { createApp } from "./app";
import { LOG_MESSAGES } from "./config/messages";
import { Repository } from "./db/repository";
import type { Env } from "./env";

const app = createApp();

export default {
  fetch: app.fetch,

  /** SPEC 1.3 F10：JST 03:00（UTC 18:00）に全セッションを削除する日次リセット。wrangler.jsonc の triggers.crons で起動する。 */
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      await new Repository(env.DB).purgeAll();
      console.info(LOG_MESSAGES.dailyResetDone);
    } catch (error) {
      console.error(LOG_MESSAGES.resetFailed, error);
      throw error;
    }
  }
} satisfies ExportedHandler<Env>;

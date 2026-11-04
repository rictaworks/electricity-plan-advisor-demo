export interface Env {
  DB: D1Database;
  /** 既定は production（wrangler.jsonc の vars）。Cookie の Secure は APP_ENV に関係なく常時付ける。 */
  APP_ENV?: string;
  /** 管理用リセットの合言葉（Worker secret。wrangler secret put で設定）。未設定ならリセット API は無効。 */
  ADMIN_RESET_TOKEN?: string;
}

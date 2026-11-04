# electricity-plan-advisor-demo

電力プラン自動提案システム（デモ版）

家族構成と月別電力使用量を入力することで、最安の電力プランを自動提案するウェブアプリケーションです。

---

## ページ一覧

| ページ名 | ローカル URL（wrangler dev） |
|----------|-----|
| トップ / 入力画面 | [http://127.0.0.1:8787/](http://127.0.0.1:8787/) |
| 結果画面 | [http://127.0.0.1:8787/result](http://127.0.0.1:8787/result) |
| DBリセット確認（管理） | [http://127.0.0.1:8787/admin/reset](http://127.0.0.1:8787/admin/reset) |

---

## API 一覧

| タイトル | エンドポイント | 認証・条件 | 仕様 |
|----------|--------------|------------|------|
| セッション取得・発行 | `GET /api/session` | なし（Cookie `session_id` を発行） | [SPEC/spec.md](SPEC/spec.md) |
| 家族構成・使用量送信 | `POST /api/submit` | なし（ハニーポット `hp_field`） | [SPEC/spec.md](SPEC/spec.md) |
| プランランキング取得 | `GET /api/result/:sessionId` | 同じ Cookie `session_id` の持ち主だけ | [SPEC/spec.md](SPEC/spec.md) |
| DBリセット（手動） | `POST /api/admin/reset` | ヘッダ `X-Admin-Token`（`ADMIN_RESET_TOKEN`）。未設定なら 404 | [SPEC/spec.md](SPEC/spec.md) |
| ヘルスチェック | `GET /api/health` | なし | [SPEC/spec.md](SPEC/spec.md) |

---

## 技術スタック

| 区分 | 技術 |
|------|------|
| フロントエンド | Next.js 15.5（TypeScript・静的書き出し） |
| バックエンド | Cloudflare Workers（Hono・TypeScript） |
| DB | Cloudflare D1（SQLite 互換・デモ版固定） |
| デプロイ | Cloudflare（Workers Assets で画面、Worker で `/api/*`、日次リセットは Cron Trigger） |

> 旧 FastAPI 版（`backend/`）と Vercel 向け設定（`frontend/vercel.json`）は、移行の判断が出るまで残しています。本番は Cloudflare 版です。

---

## セキュリティと運用の方針

- **Cookie**: `session_id` は HttpOnly・SameSite=Lax・**Secure を常時付与**。個人情報は収集しません（氏名・メール・住所・生年月日なし）。
- **結果の閲覧**: `GET /api/result/:sessionId` は、リクエストの Cookie が同じ ID のときだけ返します。ID を知っているだけでは読めません。
- **管理リセット**: `POST /api/admin/reset` は全データを削除します。`ADMIN_RESET_TOKEN`（Worker secret）が一致する場合だけ実行します。未設定のときはエンドポイントごと無効（404）です。
  - 本番: `npx wrangler secret put ADMIN_RESET_TOKEN`（値はチャット・ファイル・コマンド履歴に残さない。人が入力する）。
  - 画面（`/admin/reset`）は実行時に管理トークンを入力する欄があり、保存しません。
- **レート制限の方針**: 匿名で呼べる `POST /api/submit` と `GET /api/session` は、同一 IP からの過剰な連続呼び出しを抑える方針です。Worker 内には未実装のため、本番公開前に Cloudflare ダッシュボードの Rate Limiting ルールを設定します（例: `/api/submit` を 1 分あたり 10 回まで、超過は 429）。ルールが無い間は制限されません。
- **入力の上限**（サーバー側で検証し、超過は 422）: 世帯人数 1〜8、年齢層 8 件以内、使用量 12 件以内、kWh 0〜10000、円 0〜300000。

---

## ローカル開発

詳細は [ENV/DEVELOPMENT.md](ENV/DEVELOPMENT.md) を参照してください。

```bash
# 1. 画面を静的書き出し（frontend/out/ を作る）
cd frontend && npm install && npm run build && cd ..

# 2. Worker の依存関係を入れ、ローカル D1 にマイグレーションを適用して起動
npm install
npm run db:migrate:local
npm run dev        # 画面と API を同一オリジンで配信（既定 http://127.0.0.1:8787）

# テスト・型検査
npm test           # Worker（Vitest）
npm run typecheck  # Worker の型検査（tsc --noEmit）
cd frontend && npm test   # 画面（Jest）
```

- ローカルの管理トークンは、リポジトリ直下の `.dev.vars`（git 管理外）に `ADMIN_RESET_TOKEN=...` と書いて設定します。書かなければ管理リセットは無効のままです。

---

## 本番デプロイ（人が実施）

1. `wrangler.jsonc` の `database_id`（未作成のためプレースホルダ）を、`wrangler d1 create` の出力で差し替える。
2. `npm run db:migrate:remote` で D1 にマイグレーションを適用する。
3. `npx wrangler secret put ADMIN_RESET_TOKEN` で管理トークンを設定する。
4. レート制限ルールを Cloudflare ダッシュボードで設定する（上記の方針）。
5. `npm run deploy`（画面を書き出してから Worker を配信する）。

---

## 仕様書

[SPEC/spec.md](SPEC/spec.md)

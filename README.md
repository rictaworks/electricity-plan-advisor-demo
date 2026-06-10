# electricity-plan-advisor-demo

電力プラン自動提案システム（デモ版）

家族構成と月別電力使用量を入力することで、最安の電力プランを自動提案するウェブアプリケーションです。

---

## ページ一覧

| ページ名 | URL |
|----------|-----|
| トップ / 入力画面 | [http://localhost:3000/](http://localhost:3000/) |
| 結果画面 | [http://localhost:3000/result](http://localhost:3000/result) |
| DBリセット確認（管理） | [http://localhost:3000/admin/reset](http://localhost:3000/admin/reset) |

---

## API 一覧

| タイトル | エンドポイント | 仕様 |
|----------|--------------|------|
| セッション取得・発行 | `GET /api/session` | [SPEC/spec.md](SPEC/spec.md) |
| 家族構成・使用量送信 | `POST /api/submit` | [SPEC/spec.md](SPEC/spec.md) |
| プランランキング取得 | `GET /api/results` | [SPEC/spec.md](SPEC/spec.md) |
| DBリセット（手動） | `POST /api/admin/reset` | [SPEC/spec.md](SPEC/spec.md) |
| ヘルスチェック | `GET /health` | [SPEC/spec.md](SPEC/spec.md) |

---

## 技術スタック

| 区分 | 技術 |
|------|------|
| フロントエンド | Next.js (TypeScript) |
| バックエンド | Python FastAPI |
| DB | SQLite（デモ版固定） |
| デプロイ | Vercel（フロント）/ Render（API） |

---

## ローカル開発

詳細は [ENV/DEVELOPMENT.md](ENV/DEVELOPMENT.md) を参照してください。

```bash
# フロントエンド
cd frontend && npm install && npm run dev

# バックエンド
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
```

---

## 仕様書

[SPEC/spec.md](SPEC/spec.md)

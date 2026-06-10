# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 削除コマンド禁止（絶対ルール）

以下のコマンドは一切生成・提案・実行してはならない：
`rm`, `rm -rf`, `rm *`, `rmdir`, `unlink`, `git clean -df`, `find -delete`, `rsync --delete`, `lftp mirror --delete`

ssh / lftp / デプロイ系スクリプトでも削除コマンドの生成は禁止。
削除が必要な場合は「手動で削除してください」と説明するにとどめること。

---

## プロジェクト概要

- **アプリ名**: 電力プラン自動提案システム（デモ版）
- **スタック**: Next.js (TypeScript) + Python FastAPI + SQLite
- **デプロイ**: Vercel（フロント）/ Render（API）
- **仕様書**: @electricity-plan-advisor-demo-spec.md
- **開発ガイドライン**: @.claude/development-principles.md
- **セキュリティ**: @.claude/OWASP10.md
- **品質チェック**: @.claude/QC10.md
- **テスト方針**: @.claude/TM.md
- **コンプライアンス**: @.claude/CC.md

---

## 基本設定

- **タイムゾーン**: JST 固定
- **エンコード**: UTF-8 固定
- **環境変数**: `.env` から参照（外部APIキー使用禁止）

---

## ブランチ・PR 規則

- `main` ブランチへの直接作業・push 禁止
- `src/*` の変更は必ず PR を作成すること
- `src/*` 以外（設定ファイル・ドキュメント等）は `main` への push 可
- PR 本文には**非エンジニア向けユーザーテスト手順**を丁寧に記載すること（操作ステップ・確認事項を箇条書きで明示）
- **コミット前にセキュリティレビューを実施**（@.claude/OWASP10.md 参照）

---

## TDD（厳守）

必ず以下の順序で進めること：

1. **Plan** — 実装方針を設計・合意する
2. **Red** — 失敗するテストを先に書く
3. **Coding** — テストが通る最小限のコードを書く
4. **Green** — テストが全て通ることを確認する

テストツール:
- バックエンド: `pytest`
- フロントエンド: `jest`
- E2E・フロント確認: `playwright`（`curl` / `wget --mirror` も使用可）

---

## ディレクトリ規約

| パス | 用途 |
|------|------|
| `TASKS/` | タスク管理 |
| `DEBUG/` | バグ報告 |
| `CLIENT/` | クライアント要望 |
| `WORK/` | 作業報告 |
| `ENV/DEVELOPMENT.md` | 開発環境情報 |
| `ENV/PRODUCTION.md` | 本番環境情報 |
| `SPEC/` | 仕様書・設計図（Mermaid） |
| `DELETE/` | ゴミ箱（削除前の仮置き場） |
| `app-ui/` | デザインモック（実装前に必ず参照） |
| `test/pr***/` | PR 単位のテストスクリプト |

---

## エージェント構成

規模に応じて `.claude/agents/` に以下を作成すること：

`director` / `project-manager` / `designer` / `debugger` / `tester` / `data-scientist` / `deployer` / `writer` / `service-manager`

---

## コーディング規約

- 制御構文・条件構文以外は**クラスまたは関数**に書くこと
- **グローバル変数禁止**（セキュリティ上の理由）
- 文字列リテラルは設定ファイルに分離すること（ハードコード禁止）
- ハードコードが存在しないことを検証するテストを書くこと
- **フォールバック禁止** — 例外処理をしっかり書くこと
- **デバッグトレース可能**なコードを書くこと（ログ出力・スタックトレースを含める）

---

## UI 規約

- アイコン: **Font Awesome** を使用すること（絵文字禁止）
- ネイティブの `alert()` / `confirm()` / `prompt()` はプロジェクト全体で**使用禁止**
- デザインモックが `app-ui/` にある場合は必ず従うこと

---

## セキュリティ固有事項（このプロジェクト）

- ハニーポット: `hp_field`（値があるリクエストは無視）
- セッション分離: 全テーブルに `session_id` カラム必須、他セッションのデータ参照禁止
- セッションID: UUID v4 フォーマットを受信時に正規表現で検証、不正な場合は新規発行
- 個人情報収集禁止: 生年月日・氏名・メール・住所・電話番号

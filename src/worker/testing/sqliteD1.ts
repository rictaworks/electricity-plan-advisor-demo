import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * テスト用の D1 互換アダプタ。Node 組み込みの node:sqlite の上に
 * prepare().bind().first()/all()/run() と batch() を実装する。
 * D1 は SQLite なので、migrations/*.sql をそのまま流し込めば本番と同じ SQL 方言で検証できる。
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(HERE, "..", "..", "..", "migrations");

type Bindable = string | number | null;

export interface RunResult {
  success: boolean;
  results: unknown[];
  meta: { changes: number };
}

class SqliteStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: Bindable[] = []
  ) {}

  bind(...values: Bindable[]): SqliteStatement {
    return new SqliteStatement(this.db, this.sql, values);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.params as never[]));
    return (row as T | undefined) ?? null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }> {
    const rows = this.db.prepare(this.sql).all(...(this.params as never[]));
    return { results: rows as T[], success: true };
  }

  async run(): Promise<RunResult> {
    return this.execute();
  }

  execute(): RunResult {
    if (/^\s*select/i.test(this.sql)) {
      const rows = this.db.prepare(this.sql).all(...(this.params as never[]));
      return { success: true, results: rows as unknown[], meta: { changes: 0 } };
    }
    const info = this.db.prepare(this.sql).run(...(this.params as never[]));
    return { success: true, results: [], meta: { changes: Number(info.changes) } };
  }
}

export function listMigrationSql(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(path.join(MIGRATIONS_DIR, name), "utf8"));
}

export interface SqliteD1Handle {
  /** Worker の env.DB に渡す値（D1Database と同じ prepare/batch の形） */
  d1: unknown;
  /** テストから直接 SQL を確認するための生の接続 */
  raw: DatabaseSync;
}

export function createSqliteD1(): SqliteD1Handle {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON");
  for (const sql of listMigrationSql()) {
    raw.exec(sql);
  }

  const d1 = {
    prepare(sql: string): SqliteStatement {
      return new SqliteStatement(raw, sql);
    },
    async batch(statements: SqliteStatement[]): Promise<RunResult[]> {
      raw.exec("BEGIN");
      try {
        const results = statements.map((statement) => statement.execute());
        raw.exec("COMMIT");
        return results;
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    }
  };

  return { d1, raw };
}

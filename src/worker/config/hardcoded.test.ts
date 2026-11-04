import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * CLAUDE.md「文字列リテラルは設定ファイルに分離すること（ハードコード禁止）」の検証。
 * 日本語の文字列は config/ と master/ 以外の実装ファイルに書かれていないことを確認する。
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.resolve(here, "..");
const JAPANESE = /[぀-ヿ㐀-鿿＀-￯]/;
const EXCLUDED_DIRS = new Set(["config", "master", "testing"]);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      return EXCLUDED_DIRS.has(name) ? [] : listSourceFiles(full);
    }
    return name.endsWith(".ts") && !name.endsWith(".test.ts") ? [full] : [];
  });
}

/** コメントを除いたコードだけを対象にする（説明文の日本語は許容する）。 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("ハードコード禁止", () => {
  it("日本語の文字列リテラルは config/ と master/ に分離されている", () => {
    const offenders = listSourceFiles(workerRoot).filter((file) =>
      stripComments(readFileSync(file, "utf8"))
        .split("\n")
        .some((line) => JAPANESE.test(line))
    );
    expect(offenders.map((f) => path.relative(workerRoot, f))).toEqual([]);
  });
});

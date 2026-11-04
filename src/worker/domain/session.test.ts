import { describe, it, expect } from "vitest";
import { validateUuidV4 } from "./session";

describe("validateUuidV4（セッションID検証）", () => {
  it("v4 の UUID を受理する", () => {
    expect(validateUuidV4("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(validateUuidV4(crypto.randomUUID())).toBe(true);
  });

  it("v1 の UUID は拒否する", () => {
    expect(validateUuidV4("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
  });

  it("不正な文字列・空・undefined は拒否する", () => {
    expect(validateUuidV4("not-a-uuid")).toBe(false);
    expect(validateUuidV4("")).toBe(false);
    expect(validateUuidV4(undefined)).toBe(false);
  });
});

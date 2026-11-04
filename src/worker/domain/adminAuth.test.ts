import { describe, it, expect } from "vitest";
import { constantTimeEquals, evaluateAdminAccess } from "./adminAuth";

describe("evaluateAdminAccess（管理用リセットの可否）", () => {
  it("期待するトークンが未設定・空なら disabled（トークンの有無を見せない）", () => {
    expect(evaluateAdminAccess(undefined, "anything")).toBe("disabled");
    expect(evaluateAdminAccess("", "")).toBe("disabled");
  });

  it("トークンを送らない・違う場合は unauthorized", () => {
    expect(evaluateAdminAccess("secret-token", undefined)).toBe("unauthorized");
    expect(evaluateAdminAccess("secret-token", "secret-tokeN")).toBe("unauthorized");
    expect(evaluateAdminAccess("secret-token", "secret-token-extra")).toBe("unauthorized");
    expect(evaluateAdminAccess("secret-token", "")).toBe("unauthorized");
  });

  it("一致したら granted", () => {
    expect(evaluateAdminAccess("secret-token", "secret-token")).toBe("granted");
  });
});

describe("constantTimeEquals", () => {
  it("同じ文字列は true、長さや内容が違えば false", () => {
    expect(constantTimeEquals("abc", "abc")).toBe(true);
    expect(constantTimeEquals("abc", "abd")).toBe(false);
    expect(constantTimeEquals("abc", "abcd")).toBe(false);
    expect(constantTimeEquals("", "a")).toBe(false);
  });
});

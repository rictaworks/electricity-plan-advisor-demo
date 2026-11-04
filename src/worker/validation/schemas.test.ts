import { describe, it, expect } from "vitest";
import { parseSubmitRequest } from "./schemas";

const validPayload = () => ({
  hp_field: "",
  member_count: 4,
  age_groups: ["30代", "30代", "10代", "10代"],
  stay_home_pattern: "balanced",
  payment_method: "bank",
  usage_records: Array.from({ length: 12 }, (_, i) => ({ year: 2025, month: i + 1, kwh: 300 }))
});

describe("parseSubmitRequest（/api/submit の入力検証）", () => {
  it("正しい入力を受理する", () => {
    expect(parseSubmitRequest(validPayload()).success).toBe(true);
  });

  it("hp_field を省略すると空文字として扱う", () => {
    const { hp_field: _omit, ...rest } = validPayload();
    const result = parseSubmitRequest(rest);
    expect(result.success && result.data.hp_field).toBe("");
  });

  it("世帯人数が 9 人以上なら拒否する", () => {
    expect(parseSubmitRequest({ ...validPayload(), member_count: 9 }).success).toBe(false);
  });

  it("世帯人数が整数でなければ拒否する", () => {
    expect(parseSubmitRequest({ ...validPayload(), member_count: 1.5 }).success).toBe(false);
  });

  it("負の kWh は拒否する", () => {
    const payload = { ...validPayload(), usage_records: [{ year: 2025, month: 1, kwh: -1 }] };
    expect(parseSubmitRequest(payload).success).toBe(false);
  });

  it("10000 kWh を超える値は拒否する", () => {
    const payload = { ...validPayload(), usage_records: [{ year: 2025, month: 1, kwh: 10001 }] };
    expect(parseSubmitRequest(payload).success).toBe(false);
  });

  it("負の円は拒否する", () => {
    const payload = { ...validPayload(), usage_records: [{ year: 2025, month: 1, yen: -100 }] };
    expect(parseSubmitRequest(payload).success).toBe(false);
  });

  it("月が 1〜12 の範囲外なら拒否する", () => {
    const payload = { ...validPayload(), usage_records: [{ year: 2025, month: 13, kwh: 100 }] };
    expect(parseSubmitRequest(payload).success).toBe(false);
  });

  it("円は 300000 を超えると拒否する", () => {
    const payload = { ...validPayload(), usage_records: [{ year: 2025, month: 1, yen: 300001 }] };
    expect(parseSubmitRequest(payload).success).toBe(false);
    const ok = { ...validPayload(), usage_records: [{ year: 2025, month: 1, yen: 300000 }] };
    expect(parseSubmitRequest(ok).success).toBe(true);
  });

  it("使用量の件数は 12 件まで", () => {
    const records = Array.from({ length: 13 }, (_, i) => ({ year: 2025, month: (i % 12) + 1, kwh: 300 }));
    expect(parseSubmitRequest({ ...validPayload(), usage_records: records }).success).toBe(false);
  });

  it("年齢層は世帯人数の上限（8 件）を超えると拒否する", () => {
    const groups = Array.from({ length: 9 }, () => "30代");
    expect(parseSubmitRequest({ ...validPayload(), age_groups: groups }).success).toBe(false);
  });

  it("年齢層の文字列が長すぎると拒否する", () => {
    expect(parseSubmitRequest({ ...validPayload(), age_groups: ["a".repeat(33)] }).success).toBe(false);
  });

  it("在宅パターン・支払方法は定められた値のみ", () => {
    expect(parseSubmitRequest({ ...validPayload(), stay_home_pattern: "night" }).success).toBe(false);
    expect(parseSubmitRequest({ ...validPayload(), payment_method: "cash" }).success).toBe(false);
  });
});

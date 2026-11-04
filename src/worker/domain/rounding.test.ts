import { describe, it, expect } from "vitest";
import { roundTo2 } from "./rounding";

/** 期待値は旧 FastAPI 版（Python の round(x, 2)）で確認した値。二進の実値が正確に中間の値は偶数側へ丸める。 */
describe("roundTo2（Python の round(x, 2) と同じ丸め）", () => {
  it("中間値（二進で正確に .xx5）は偶数側へ丸める", () => {
    expect(roundTo2(53.625)).toBe(53.62);
    expect(roundTo2(268836.625)).toBe(268836.62);
    expect(roundTo2(0.375)).toBe(0.38);
    expect(roundTo2(0.125)).toBe(0.12);
  });

  it("中間値でなければ通常どおり四捨五入する", () => {
    expect(roundTo2(1.234)).toBe(1.23);
    expect(roundTo2(1.236)).toBe(1.24);
  });

  it("二進の実値が中間より小さければ切り捨てる", () => {
    expect(roundTo2(1.005)).toBe(1);
    expect(roundTo2(2.675)).toBe(2.67);
  });

  it("負の値も対称に丸める", () => {
    expect(roundTo2(-0.125)).toBe(-0.12);
    expect(roundTo2(-1.236)).toBe(-1.24);
  });

  it("0 と整数はそのまま", () => {
    expect(roundTo2(0)).toBe(0);
    expect(roundTo2(12345)).toBe(12345);
  });
});

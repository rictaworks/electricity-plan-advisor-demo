import { describe, it, expect } from "vitest";
import { UsageEstimator } from "./usage";

const estimator = new UsageEstimator();

describe("UsageEstimator.estimateMonth（未入力月の推定）", () => {
  it("正の kWh を返す", () => {
    expect(estimator.estimateMonth(4, ["30代", "30代"], "balanced", 6)).toBeGreaterThan(0);
  });

  it("夏（8 月）は春（5 月）より多い", () => {
    expect(estimator.estimateMonth(4, ["30代"], "balanced", 8)).toBeGreaterThan(
      estimator.estimateMonth(4, ["30代"], "balanced", 5)
    );
  });

  it("人数が多いほど多い", () => {
    expect(estimator.estimateMonth(4, ["30代"], "balanced", 6)).toBeGreaterThan(
      estimator.estimateMonth(2, ["30代"], "balanced", 6)
    );
  });

  it("7 人以上は 6 人の基本値に 1 人あたりの加算を足してから係数を掛ける", () => {
    // 6 人・均等・6 月：基本 500 kWh × 年齢層 1.0 × 季節 0.9
    // 7 人：（基本 500 + 加算 65）× 1.0 × 0.9
    const seven = estimator.estimateMonth(7, ["30代"], "balanced", 6);
    expect(seven).toBeCloseTo((500 + 65) * 0.9, 1);
  });

  it("年齢層の係数が高いほど多い", () => {
    expect(estimator.estimateMonth(2, ["60代以上", "60代以上"], "balanced", 6)).toBeGreaterThan(
      estimator.estimateMonth(2, ["20代", "20代"], "balanced", 6)
    );
  });
});

describe("UsageEstimator.fillTwelveMonths（12 か月分の補完）", () => {
  it("入力が無ければ 12 か月すべて推定値で埋める", () => {
    const rows = estimator.fillTwelveMonths([], {
      year: 2025,
      memberCount: 3,
      ageGroups: ["30代"],
      stayHomePattern: "balanced"
    });
    expect(rows).toHaveLength(12);
    expect(rows.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const row of rows) {
      expect(row.kwhActual).toBeNull();
      expect(row.kwhEstimated).not.toBeNull();
      expect(row.kwhUsed).toBe(row.kwhEstimated);
    }
  });

  it("入力のある月は実測値を使い、無い月は推定する", () => {
    const rows = estimator.fillTwelveMonths([{ year: 2025, month: 1, kwhActual: 400 }], {
      year: 2025,
      memberCount: 2,
      ageGroups: ["30代", "40代"],
      stayHomePattern: "evening"
    });
    expect(rows[0]).toMatchObject({ month: 1, kwhActual: 400, kwhEstimated: null, kwhUsed: 400 });
    expect(rows[1]?.kwhUsed).toBeGreaterThan(0);
    expect(rows[1]?.kwhEstimated).toBe(rows[1]?.kwhUsed);
  });

  it("実測値が null の月は推定する", () => {
    const rows = estimator.fillTwelveMonths([{ year: 2025, month: 2, kwhActual: null }], {
      year: 2025,
      memberCount: 3,
      ageGroups: ["30代"],
      stayHomePattern: "balanced"
    });
    expect(rows[1]?.kwhEstimated).not.toBeNull();
    expect(rows[1]?.kwhUsed).toBeGreaterThan(0);
  });

  it("同じ月が重複したら後の入力を採用する", () => {
    const rows = estimator.fillTwelveMonths(
      [
        { year: 2025, month: 3, kwhActual: 100 },
        { year: 2025, month: 3, kwhActual: 250 }
      ],
      { year: 2025, memberCount: 1, ageGroups: ["30代"], stayHomePattern: "balanced" }
    );
    expect(rows[2]?.kwhUsed).toBe(250);
  });
});

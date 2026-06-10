"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RankedPlan } from "@/types/result";
import PlanRankingCard from "@/components/result/PlanRankingCard";
import SavingsChart from "@/components/result/SavingsChart";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";

export default function ResultPage() {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankedPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("ranking");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setRanking(JSON.parse(raw));
    } catch {
      setError("結果データの読み込みに失敗しました");
    }
  }, [router]);

  if (!ranking && !error) {
    return (
      <main className="container">
        <LoadingSpinner message="結果を読み込み中..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <ErrorMessage message={error} />
        <button className="btn btn-secondary" onClick={() => router.push("/")}>
          <i className="fa-solid fa-arrow-left" />
          入力に戻る
        </button>
      </main>
    );
  }

  const suitable = ranking!.filter((p) => !p.is_unsuitable);
  const unsuitable = ranking!.filter((p) => p.is_unsuitable);

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e40af" }}>
          <i className="fa-solid fa-ranking-star" style={{ marginRight: 10 }} />
          電力プランランキング
        </h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>
          {ranking!.length}件のプランを比較しました
        </p>
      </header>

      <div className="card">
        <h2 className="section-title">
          <i className="fa-solid fa-piggy-bank" style={{ marginRight: 8 }} />
          節約額グラフ
        </h2>
        <SavingsChart plans={ranking!} />
      </div>

      <div className="card">
        <h2 className="section-title">
          <i className="fa-solid fa-list-ol" style={{ marginRight: 8 }} />
          プランランキング
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suitable.map((plan) => (
            <PlanRankingCard key={plan.plan_code} plan={plan} />
          ))}
          {unsuitable.length > 0 && (
            <>
              <h3 style={{ marginTop: 16, color: "#6b7280", fontSize: "0.95rem" }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                在宅パターンに不向きなプラン
              </h3>
              {unsuitable.map((plan) => (
                <PlanRankingCard key={plan.plan_code} plan={plan} />
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/")}
          style={{ fontSize: "1rem" }}
        >
          <i className="fa-solid fa-rotate-left" />
          再計算する
        </button>
      </div>
    </main>
  );
}

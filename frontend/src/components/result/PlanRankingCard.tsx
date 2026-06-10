"use client";

import { RankedPlan } from "@/types/result";
import { formatCurrency } from "@/lib/converters";
import RecommendationBadge from "./RecommendationBadge";

interface PlanRankingCardProps {
  plan: RankedPlan;
}

const RANK_ICONS: Record<number, string> = {
  1: "fa-trophy",
  2: "fa-medal",
  3: "fa-award",
};

const RANK_COLORS: Record<number, string> = {
  1: "#d97706",
  2: "#6b7280",
  3: "#b45309",
};

export default function PlanRankingCard({ plan }: PlanRankingCardProps) {
  const isTop3 = plan.rank <= 3;
  const rankIcon = RANK_ICONS[plan.rank] ?? "fa-circle";
  const rankColor = RANK_COLORS[plan.rank] ?? "#1e40af";

  return (
    <div
      style={{
        background: plan.is_unsuitable ? "#f9fafb" : isTop3 ? "#eff6ff" : "#fff",
        border: `1px solid ${plan.is_unsuitable ? "#e5e7eb" : isTop3 ? "#93c5fd" : "#e5e7eb"}`,
        borderRadius: 8,
        padding: 16,
        opacity: plan.is_unsuitable ? 0.8 : 1,
      }}
      data-testid={`plan-card-${plan.rank}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: "1.4rem", color: rankColor, minWidth: 28 }}>
          <i className={`fa-solid ${rankIcon}`} />
        </span>
        <div>
          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{plan.company_name}</div>
          <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{plan.plan_name}</div>
        </div>
        {plan.rank === 1 && !plan.is_unsuitable && (
          <span
            style={{
              marginLeft: "auto",
              background: "#d97706",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            おすすめ
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          fontSize: "0.9rem",
        }}
      >
        <div>
          <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>年間合計</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {formatCurrency(plan.annual_total)}
          </div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>月平均</div>
          <div>{formatCurrency(plan.monthly_avg)}</div>
        </div>
        <div>
          <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>節約額（年間）</div>
          <div
            style={{
              fontWeight: 700,
              color:
                plan.saving_vs_standard > 0
                  ? "#16a34a"
                  : plan.saving_vs_standard < 0
                  ? "#dc2626"
                  : "#6b7280",
            }}
          >
            {plan.saving_vs_standard > 0 && "+"}
            {formatCurrency(plan.saving_vs_standard)}
          </div>
        </div>
      </div>

      <RecommendationBadge
        reason={plan.recommendation_reason}
        isUnsuitable={plan.is_unsuitable}
      />
    </div>
  );
}

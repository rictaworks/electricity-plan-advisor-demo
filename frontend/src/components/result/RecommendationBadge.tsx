"use client";

interface RecommendationBadgeProps {
  reason: string;
  isUnsuitable: boolean;
}

export default function RecommendationBadge({
  reason,
  isUnsuitable,
}: RecommendationBadgeProps) {
  if (isUnsuitable) {
    return (
      <div
        style={{
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: "0.85rem",
          color: "#92400e",
          marginTop: 8,
        }}
      >
        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
        {reason}
      </div>
    );
  }
  return (
    <div
      style={{
        background: "#eff6ff",
        border: "1px solid #93c5fd",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: "0.85rem",
        color: "#1e40af",
        marginTop: 8,
      }}
    >
      <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
      {reason}
    </div>
  );
}

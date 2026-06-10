"use client";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "計算中..." }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        gap: 16,
      }}
    >
      <i
        className="fa-solid fa-spinner fa-spin"
        style={{ fontSize: 32, color: "#1e40af" }}
        aria-hidden="true"
      />
      <p style={{ color: "#6b7280" }}>{message}</p>
    </div>
  );
}

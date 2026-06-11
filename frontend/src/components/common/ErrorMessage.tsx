"use client";

interface ErrorMessageProps {
  message: string | null;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: 8,
        padding: "12px 16px",
        color: "#dc2626",
        marginBottom: 16,
      }}
    >
      <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
      {message}
    </div>
  );
}

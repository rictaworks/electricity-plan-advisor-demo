"use client";

import { useState } from "react";
import Link from "next/link";
import { adminReset } from "@/lib/api";
import ErrorMessage from "@/components/common/ErrorMessage";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AdminResetPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowConfirm(false);
    try {
      const res = await adminReset();
      setMessage(
        `リセット完了: ${res.deleted_sessions}件のセッションを削除しました`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "リセットに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1e40af", textDecoration: "none", marginBottom: 16, fontSize: "0.9rem" }}>
        <i className="fa-solid fa-arrow-left" />
        トップへ戻る
      </Link>
      <div className="card">
        <h1
          style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 16, color: "#dc2626" }}
        >
          <i className="fa-solid fa-trash-can" style={{ marginRight: 8 }} />
          データベースリセット（管理者）
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          全セッションデータを削除します。この操作は取り消せません。
        </p>

        <ErrorMessage message={error} />

        {message && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#16a34a",
              marginBottom: 16,
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }} />
            {message}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="リセット中..." />
        ) : showConfirm ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <p style={{ marginBottom: 12, fontWeight: 600, color: "#dc2626" }}>
              本当にリセットしますか？
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-primary" onClick={handleReset}>
                <i className="fa-solid fa-check" />
                実行する
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                <i className="fa-solid fa-xmark" />
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn"
            style={{ background: "#dc2626", color: "#fff" }}
            onClick={() => setShowConfirm(true)}
          >
            <i className="fa-solid fa-trash-can" />
            DBリセットを実行
          </button>
        )}
      </div>
    </main>
  );
}

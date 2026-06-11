"use client";

import { useState } from "react";
import { MonthlyUsageInput } from "@/types/usage";
import { yenToKwh } from "@/lib/converters";
import { validateKwh } from "@/lib/validators";

interface MonthInputProps {
  year: number;
  month: number;
  value: MonthlyUsageInput;
  onChange: (value: MonthlyUsageInput) => void;
}

const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function MonthInput({ year, month, value, onChange }: MonthInputProps) {
  const [mode, setMode] = useState<"kwh" | "yen">("kwh");
  const [inputStr, setInputStr] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInput = (raw: string) => {
    setInputStr(raw);
    if (raw === "" || raw === null) {
      onChange({ year, month, kwh: undefined, yen: undefined });
      setError(null);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) {
      setError("数値を入力してください");
      return;
    }
    if (mode === "kwh") {
      const err = validateKwh(num);
      setError(err);
      if (!err) onChange({ year, month, kwh: num });
    } else {
      if (num < 0) {
        setError("0以上の値を入力してください");
        return;
      }
      setError(null);
      const kwh = yenToKwh(num);
      onChange({ year, month, kwh, yen: num });
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "kwh" ? "yen" : "kwh"));
    setInputStr("");
    onChange({ year, month, kwh: undefined, yen: undefined });
    setError(null);
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <label
        htmlFor={`month-input-${month}`}
        style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 2 }}
      >
        {MONTH_LABELS[month - 1]}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          id={`month-input-${month}`}
          type="number"
          min={0}
          step="0.1"
          placeholder={mode === "kwh" ? "kWh（省略可）" : "円（省略可）"}
          value={inputStr}
          onChange={(e) => handleInput(e.target.value)}
          style={{
            width: 140,
            padding: "6px 8px",
            border: `1px solid ${error ? "#dc2626" : "#d1d5db"}`,
            borderRadius: 6,
            fontSize: "0.95rem",
          }}
        />
        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          {mode === "kwh" ? "kWh" : "円"}
        </span>
        <button
          type="button"
          onClick={toggleMode}
          title={mode === "kwh" ? "円入力に切替" : "kWh入力に切替"}
          style={{
            background: "none",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "0.8rem",
            color: "#1e40af",
          }}
        >
          <i className="fa-solid fa-arrow-right-arrow-left" style={{ marginRight: 4 }} />
          {mode === "kwh" ? "円入力" : "kWh入力"}
        </button>
        {mode === "yen" && value.kwh !== undefined && (
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            ≈ {value.kwh} kWh
          </span>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

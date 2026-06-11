"use client";

import { MonthlyUsageInput } from "@/types/usage";
import MonthInput from "./MonthInput";

interface UsageFormProps {
  records: MonthlyUsageInput[];
  onChange: (records: MonthlyUsageInput[]) => void;
}

export default function UsageForm({ records, onChange }: UsageFormProps) {
  const currentYear = new Date().getFullYear();

  const getRecord = (month: number): MonthlyUsageInput => {
    return (
      records.find((r) => r.month === month) ?? {
        year: currentYear,
        month,
        kwh: undefined,
      }
    );
  };

  const handleChange = (updated: MonthlyUsageInput) => {
    const filtered = records.filter((r) => r.month !== updated.month);
    if (updated.kwh !== undefined) {
      onChange([...filtered, updated]);
    } else {
      onChange(filtered);
    }
  };

  return (
    <div>
      <h2 className="section-title">
        <i className="fa-solid fa-bolt" style={{ marginRight: 8 }} />
        月別電力使用量
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 400,
            color: "#6b7280",
            marginLeft: 8,
          }}
        >
          ※未入力の月は自動推定されます
        </span>
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 8,
        }}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <MonthInput
            key={month}
            year={currentYear}
            month={month}
            value={getRecord(month)}
            onChange={handleChange}
          />
        ))}
      </div>
    </div>
  );
}

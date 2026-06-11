"use client";

import { AGE_GROUPS } from "@/constants/ageGroups";

interface AgeGroupSelectorProps {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
}

export default function AgeGroupSelector({
  index,
  value,
  onChange,
}: AgeGroupSelectorProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        htmlFor={`age-group-${index}`}
        style={{ fontSize: "0.9rem", marginRight: 8 }}
      >
        <i className="fa-solid fa-person" style={{ marginRight: 4 }} />
        {index + 1}人目:
      </label>
      <select
        id={`age-group-${index}`}
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          fontSize: "0.95rem",
        }}
      >
        <option value="">選択してください</option>
        {AGE_GROUPS.map((ag) => (
          <option key={ag} value={ag}>
            {ag}
          </option>
        ))}
      </select>
    </div>
  );
}

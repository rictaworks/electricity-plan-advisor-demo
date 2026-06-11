"use client";

import { HouseholdFormData } from "@/types/household";
import { STAY_PATTERNS } from "@/constants/stayPatterns";
import AgeGroupSelector from "./AgeGroupSelector";

interface HouseholdFormProps {
  data: HouseholdFormData;
  onChange: (data: HouseholdFormData) => void;
}

export default function HouseholdForm({ data, onChange }: HouseholdFormProps) {
  const handleMemberCountChange = (count: number) => {
    const newAgeGroups = Array(count)
      .fill("")
      .map((_, i) => data.ageGroups[i] ?? "");
    onChange({ ...data, memberCount: count, ageGroups: newAgeGroups });
  };

  const handleAgeGroupChange = (index: number, value: string) => {
    const newGroups = [...data.ageGroups];
    newGroups[index] = value;
    onChange({ ...data, ageGroups: newGroups });
  };

  return (
    <div>
      <h2 className="section-title">
        <i className="fa-solid fa-house-user" style={{ marginRight: 8 }} />
        家族構成
      </h2>

      <div className="form-group">
        <label className="form-label">
          世帯人数: <strong>{data.memberCount}人</strong>
        </label>
        <input
          type="range"
          min={1}
          max={8}
          value={data.memberCount}
          onChange={(e) => handleMemberCountChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#1e40af" }}
          aria-label="世帯人数"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          <span>1人</span>
          <span>8人</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">各メンバーの年齢層</label>
        {Array.from({ length: data.memberCount }, (_, i) => (
          <AgeGroupSelector
            key={i}
            index={i}
            value={data.ageGroups[i] ?? ""}
            onChange={handleAgeGroupChange}
          />
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">在宅パターン</label>
        {STAY_PATTERNS.map((p) => (
          <label
            key={p.value}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}
          >
            <input
              type="radio"
              name="stay_home_pattern"
              value={p.value}
              checked={data.stayHomePattern === p.value}
              onChange={() => onChange({ ...data, stayHomePattern: p.value })}
            />
            {p.label}
          </label>
        ))}
      </div>

      <div className="form-group">
        <label className="form-label">支払方法</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <input
            type="radio"
            name="payment_method"
            value="bank"
            checked={data.paymentMethod === "bank"}
            onChange={() => onChange({ ...data, paymentMethod: "bank" })}
          />
          <i className="fa-solid fa-building-columns" style={{ marginRight: 4 }} />
          口座振替
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="radio"
            name="payment_method"
            value="credit"
            checked={data.paymentMethod === "credit"}
            onChange={() => onChange({ ...data, paymentMethod: "credit" })}
          />
          <i className="fa-solid fa-credit-card" style={{ marginRight: 4 }} />
          クレジットカード
        </label>
      </div>
    </div>
  );
}

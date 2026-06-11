"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HouseholdFormData } from "@/types/household";
import { MonthlyUsageInput } from "@/types/usage";
import HouseholdForm from "@/components/form/HouseholdForm";
import UsageForm from "@/components/form/UsageForm";
import HoneypotField from "@/components/form/HoneypotField";
import ErrorMessage from "@/components/common/ErrorMessage";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useSubmit } from "@/hooks/useSubmit";
import { validateAgeGroups } from "@/lib/validators";

const DEFAULT_HOUSEHOLD: HouseholdFormData = {
  memberCount: 2,
  ageGroups: ["30代", "30代"],
  stayHomePattern: "balanced",
  paymentMethod: "bank",
};

export default function HomePage() {
  const router = useRouter();
  const { submit, loading, error } = useSubmit();
  const [household, setHousehold] = useState<HouseholdFormData>(DEFAULT_HOUSEHOLD);
  const [usageRecords, setUsageRecords] = useState<MonthlyUsageInput[]>([]);
  const [hpField, setHpField] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ageError = validateAgeGroups(household.ageGroups, household.memberCount);
    if (ageError) {
      setValidationError(ageError);
      return;
    }
    setValidationError(null);

    const result = await submit(household, usageRecords);
    if (result) {
      sessionStorage.setItem("ranking", JSON.stringify(result.ranking));
      sessionStorage.setItem("session_id", result.session_id);
      router.push("/result");
    }
  };

  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <header style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e40af" }}>
          <i className="fa-solid fa-plug-circle-bolt" style={{ marginRight: 10 }} />
          電力プラン自動提案システム
        </h1>
        <p style={{ color: "#6b7280", marginTop: 6 }}>
          家族構成と電力使用量を入力して、最安プランを見つけましょう
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <HoneypotField value={hpField} onChange={setHpField} />

        <div className="card">
          <HouseholdForm data={household} onChange={setHousehold} />
        </div>

        <div className="card">
          <UsageForm records={usageRecords} onChange={setUsageRecords} />
        </div>

        <ErrorMessage message={validationError ?? error} />

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {loading ? (
            <LoadingSpinner message="プランを計算中..." />
          ) : (
            <button type="submit" className="btn btn-primary" style={{ fontSize: "1.1rem", padding: "14px 40px" }}>
              <i className="fa-solid fa-magnifying-glass-chart" />
              最安プランを見つける
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

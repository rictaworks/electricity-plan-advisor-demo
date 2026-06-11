"use client";

import { useState } from "react";
import { submitForm } from "@/lib/api";
import { HouseholdFormData } from "@/types/household";
import { MonthlyUsageInput } from "@/types/usage";
import { SubmitResponse } from "@/types/result";

export function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    household: HouseholdFormData,
    usageRecords: MonthlyUsageInput[]
  ): Promise<SubmitResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await submitForm(household, usageRecords);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信エラーが発生しました");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

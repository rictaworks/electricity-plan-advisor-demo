"use client";

import { useState, useEffect } from "react";
import { getResult } from "@/lib/api";
import { SubmitResponse } from "@/types/result";

export function useResult(sessionId: string | null) {
  const [data, setData] = useState<SubmitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getResult(sessionId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return { data, loading, error };
}

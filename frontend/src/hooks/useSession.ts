"use client";

import { useState, useEffect } from "react";
import { getSession } from "@/lib/api";

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession()
      .then((res) => setSessionId(res.session_id))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { sessionId, loading, error };
}

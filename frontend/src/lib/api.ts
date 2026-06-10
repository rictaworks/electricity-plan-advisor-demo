import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { HouseholdFormData } from "@/types/household";
import { MonthlyUsageInput } from "@/types/usage";
import { SubmitResponse } from "@/types/result";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getSession(): Promise<{ session_id: string }> {
  return fetchJson(API_ENDPOINTS.SESSION);
}

export async function submitForm(
  household: HouseholdFormData,
  usageRecords: MonthlyUsageInput[],
  hpField: string = ""
): Promise<SubmitResponse> {
  return fetchJson<SubmitResponse>(API_ENDPOINTS.SUBMIT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hp_field: hpField,
      member_count: household.memberCount,
      age_groups: household.ageGroups,
      stay_home_pattern: household.stayHomePattern,
      payment_method: household.paymentMethod,
      usage_records: usageRecords,
    }),
  });
}

export async function getResult(sessionId: string): Promise<SubmitResponse> {
  return fetchJson<SubmitResponse>(API_ENDPOINTS.RESULT(sessionId));
}

export async function adminReset(): Promise<{ message: string; deleted_sessions: number }> {
  return fetchJson(API_ENDPOINTS.ADMIN_RESET, { method: "POST" });
}

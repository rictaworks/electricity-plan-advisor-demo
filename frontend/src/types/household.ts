export interface HouseholdFormData {
  memberCount: number;
  ageGroups: string[];
  stayHomePattern: "morning" | "evening" | "balanced";
  paymentMethod: "bank" | "credit";
}

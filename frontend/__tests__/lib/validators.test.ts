import {
  validateKwh,
  validateMemberCount,
  validateAgeGroups,
  validateYen,
} from "@/lib/validators";

describe("validateKwh", () => {
  it("accepts zero", () => {
    expect(validateKwh(0)).toBeNull();
  });

  it("accepts 10000", () => {
    expect(validateKwh(10000)).toBeNull();
  });

  it("accepts mid-range value", () => {
    expect(validateKwh(300)).toBeNull();
  });

  it("rejects negative value", () => {
    expect(validateKwh(-1)).not.toBeNull();
  });

  it("rejects value over 10000", () => {
    expect(validateKwh(10001)).not.toBeNull();
  });

  it("returns null for undefined", () => {
    expect(validateKwh(undefined)).toBeNull();
  });
});

describe("validateMemberCount", () => {
  it("accepts 1", () => {
    expect(validateMemberCount(1)).toBeNull();
  });

  it("accepts 8", () => {
    expect(validateMemberCount(8)).toBeNull();
  });

  it("rejects 0", () => {
    expect(validateMemberCount(0)).not.toBeNull();
  });

  it("rejects 9", () => {
    expect(validateMemberCount(9)).not.toBeNull();
  });

  it("rejects float", () => {
    expect(validateMemberCount(1.5)).not.toBeNull();
  });
});

describe("validateAgeGroups", () => {
  it("passes when count matches memberCount", () => {
    expect(validateAgeGroups(["30代", "30代"], 2)).toBeNull();
  });

  it("fails when count does not match memberCount", () => {
    expect(validateAgeGroups(["30代"], 2)).not.toBeNull();
  });
});

describe("validateYen", () => {
  it("accepts positive value", () => {
    expect(validateYen(5000)).toBeNull();
  });

  it("rejects negative value", () => {
    expect(validateYen(-100)).not.toBeNull();
  });

  it("returns null for undefined", () => {
    expect(validateYen(undefined)).toBeNull();
  });
});

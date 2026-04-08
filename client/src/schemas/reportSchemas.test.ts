import { describe, it, expect } from "vitest";
import { reportSchema } from "@/schemas/reportSchemas";

describe("reportSchema", () => {
  const validData = {
    title: "Robbery at main street",
    description: "Saw a robbery happening",
    category: "robbery" as const,
    severity: "high" as const,
    latitude: 6.5,
    longitude: 3.4,
  };

  it("accepts valid data", () => {
    const result = reportSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts valid data without description", () => {
    const { description: _, ...data } = validData;
    const result = reportSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = reportSchema.safeParse({ ...validData, title: "Hi" });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 255 chars", () => {
    const result = reportSchema.safeParse({
      ...validData,
      title: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 2000 chars", () => {
    const result = reportSchema.safeParse({
      ...validData,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = reportSchema.safeParse({
      ...validData,
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const categories = [
      "robbery",
      "assault",
      "fire",
      "accident",
      "kidnapping",
      "terrorism",
      "flooding",
      "suspicious",
      "gunshot",
      "vandalism",
      "medical",
      "other",
    ];
    for (const category of categories) {
      const result = reportSchema.safeParse({ ...validData, category });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid severity", () => {
    const result = reportSchema.safeParse({
      ...validData,
      severity: "extreme",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid severity levels", () => {
    for (const severity of ["low", "medium", "high", "critical"]) {
      const result = reportSchema.safeParse({ ...validData, severity });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing latitude", () => {
    const { latitude: _, ...data } = validData;
    const result = reportSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects missing longitude", () => {
    const { longitude: _, ...data } = validData;
    const result = reportSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects non-number latitude", () => {
    const result = reportSchema.safeParse({ ...validData, latitude: "bad" });
    expect(result.success).toBe(false);
  });
});

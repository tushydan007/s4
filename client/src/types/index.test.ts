import { describe, it, expect } from "vitest";
import {
  REPORT_CATEGORIES,
  SEVERITY_LEVELS,
  STATION_TYPES,
} from "../types/index";

describe("types constants", () => {
  it("REPORT_CATEGORIES has 12 categories", () => {
    expect(REPORT_CATEGORIES).toHaveLength(12);
  });

  it("each category has value, label, and icon", () => {
    for (const cat of REPORT_CATEGORIES) {
      expect(cat).toHaveProperty("value");
      expect(cat).toHaveProperty("label");
      expect(cat).toHaveProperty("icon");
      expect(typeof cat.value).toBe("string");
      expect(typeof cat.label).toBe("string");
      expect(typeof cat.icon).toBe("string");
    }
  });

  it("REPORT_CATEGORIES includes key categories", () => {
    const values = REPORT_CATEGORIES.map((c) => c.value);
    expect(values).toContain("robbery");
    expect(values).toContain("fire");
    expect(values).toContain("assault");
    expect(values).toContain("other");
  });

  it("SEVERITY_LEVELS has 4 levels", () => {
    expect(SEVERITY_LEVELS).toHaveLength(4);
  });

  it("each severity has value, label, and color", () => {
    for (const sev of SEVERITY_LEVELS) {
      expect(sev).toHaveProperty("value");
      expect(sev).toHaveProperty("label");
      expect(sev).toHaveProperty("color");
    }
  });

  it("SEVERITY_LEVELS has correct order", () => {
    const values = SEVERITY_LEVELS.map((s) => s.value);
    expect(values).toEqual(["low", "medium", "high", "critical"]);
  });

  it("STATION_TYPES has 6 types", () => {
    expect(STATION_TYPES).toHaveLength(4);
  });

  it("each station type has value, label, and color", () => {
    for (const st of STATION_TYPES) {
      expect(st).toHaveProperty("value");
      expect(st).toHaveProperty("label");
      expect(st).toHaveProperty("color");
    }
  });

  it("STATION_TYPES includes police, army, fire, and health", () => {
    const values = STATION_TYPES.map((s) => s.value);
    expect(values).toContain("police");
    expect(values).toContain("army");
    expect(values).toContain("fire");
    expect(values).toContain("health");
  });
});

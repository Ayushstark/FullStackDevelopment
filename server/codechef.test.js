import { describe, expect, it } from "vitest";
import { isValidHandle, getCodeChefProfile } from "./services/codechefService.js";

describe("codechefService", () => {
  describe("isValidHandle", () => {
    it("accepts valid alphanumeric CodeChef handles with underscores and dots", () => {
      expect(isValidHandle("alex_coder")).toBe(true);
      expect(isValidHandle("tourist")).toBe(true);
      expect(isValidHandle("mohit_1926")).toBe(true);
      expect(isValidHandle("gennady.korotkevich")).toBe(true);
    });

    it("rejects invalid characters, empty strings, and out-of-range lengths", () => {
      expect(isValidHandle("")).toBe(false);
      expect(isValidHandle("a")).toBe(false);
      expect(isValidHandle("handle-with-hyphens")).toBe(false);
      expect(isValidHandle("handle with spaces")).toBe(false);
      expect(isValidHandle(null)).toBe(false);
      expect(isValidHandle(undefined)).toBe(false);
    });
  });

  describe("getCodeChefProfile input handling", () => {
    it("returns error early for invalid handles without performing network request", async () => {
      const result = await getCodeChefProfile("!");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid CodeChef handle");
    });
  });
});


import { describe, expect, it } from "vitest";
import { isValidHandle, getGfgProfile } from "./services/gfgService.js";

describe("gfgService", () => {
  describe("isValidHandle", () => {
    it("accepts valid alphanumeric GFG handles with underscores, hyphens, and dots", () => {
      expect(isValidHandle("alex_shah")).toBe(true);
      expect(isValidHandle("tourist")).toBe(true);
      expect(isValidHandle("geeks-for-geeks")).toBe(true);
      expect(isValidHandle("coder.1926")).toBe(true);
    });

    it("rejects invalid characters, empty strings, and out-of-range lengths", () => {
      expect(isValidHandle("")).toBe(false);
      expect(isValidHandle("a")).toBe(false);
      expect(isValidHandle("handle with spaces")).toBe(false);
      expect(isValidHandle("invalid!character")).toBe(false);
      expect(isValidHandle(null)).toBe(false);
      expect(isValidHandle(undefined)).toBe(false);
    });
  });

  describe("getGfgProfile input handling", () => {
    it("returns error early for invalid handles without performing network requests", async () => {
      const result = await getGfgProfile("!");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid GeeksforGeeks handle");
    });
  });
});


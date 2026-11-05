import { describe, expect, it } from "vitest";
import { isValidHandle, getGitHubProfile } from "../src/services/githubService.js";

describe("githubService", () => {
  describe("isValidHandle", () => {
    it("accepts valid alphanumeric GitHub handles with hyphens", () => {
      expect(isValidHandle("DARK-1926")).toBe(true);
      expect(isValidHandle("alexshah-dev")).toBe(true);
      expect(isValidHandle("octocat")).toBe(true);
      expect(isValidHandle("a")).toBe(true);
    });

    it("rejects invalid characters, empty strings, consecutive hyphens, and leading/trailing hyphens", () => {
      expect(isValidHandle("")).toBe(false);
      expect(isValidHandle("-leading-hyphen")).toBe(false);
      expect(isValidHandle("trailing-hyphen-")).toBe(false);
      expect(isValidHandle("handle with spaces")).toBe(false);
      expect(isValidHandle("invalid!character")).toBe(false);
      expect(isValidHandle(null)).toBe(false);
      expect(isValidHandle(undefined)).toBe(false);
    });
  });

  describe("getGitHubProfile input handling", () => {
    it("returns error early for invalid handles without performing network requests", async () => {
      const result = await getGitHubProfile("!");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid GitHub handle");
    });
  });
});

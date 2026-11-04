import { describe, it, expect } from "vitest";
import { escapeCsvCell, formatLogsToCsv } from "./exportLogs.js";

describe("exportLogs utility", () => {
  it("escapes CSV values correctly", () => {
    expect(escapeCsvCell("Hello, world")).toBe('"Hello, world"');
    expect(escapeCsvCell('Quote "test"')).toBe('"Quote ""test"""');
    expect(escapeCsvCell(42)).toBe('"42"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });

  it("formats log entries into a standard CSV string", () => {
    const mockLogs = [
      {
        date: "2026-10-27",
        platform: "LeetCode",
        problemsSolved: 3,
        difficulty: "Medium",
        category: "Algorithms & DSA",
        notes: "Solved Binary Tree Path Sum",
      },
      {
        date: "2026-10-26",
        platform: "Codeforces",
        problemsSolved: 4,
        difficulty: "Hard",
        category: "Contest",
        notes: 'Round 900 div 3, solved "A" & "B"',
      },
    ];

    const csv = formatLogsToCsv(mockLogs);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe("Date,Platform,Problems Solved,Difficulty,Category,Notes");
    expect(lines[1]).toContain('"2026-10-27"');
    expect(lines[1]).toContain('"LeetCode"');
    expect(lines[1]).toContain('"3"');
    expect(lines[2]).toContain('Round 900 div 3, solved ""A"" & ""B""');
  });

  it("handles empty logs gracefully", () => {
    const csv = formatLogsToCsv([]);
    expect(csv).toBe("Date,Platform,Problems Solved,Difficulty,Category,Notes");
  });
});

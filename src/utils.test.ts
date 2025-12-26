import { describe, it, expect } from "vitest";
import { sanitizeBetString } from "./utils";

describe("sanitizeBetString", () => {
  describe("Pot percentage bets", () => {
    it("should validate simple pot percentage", () => {
      const result = sanitizeBetString("50", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("50");
    });

    it("should validate multiple pot percentages", () => {
      const result = sanitizeBetString("33, 50, 75", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("33, 50, 75");
    });

    it("should handle space-separated pot percentages", () => {
      const result = sanitizeBetString("33 50 75", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("33, 50, 75");
    });

    it("should handle decimal pot percentages", () => {
      const result = sanitizeBetString("33.5", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("33.5");
    });

    it("should reject invalid pot percentage", () => {
      const result = sanitizeBetString("abc", false);
      expect(result.valid).toBe(false);
      // Note: 'abc' contains 'c' so it's treated as additive format first
      expect(result.s).toContain("Invalid");
    });
  });

  describe("Multiplier bets (x)", () => {
    it("should validate multiplier for raises", () => {
      const result = sanitizeBetString("2.5x", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("2.5x");
    });

    it("should validate integer multiplier", () => {
      const result = sanitizeBetString("3x", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("3x");
    });

    it("should reject multiplier for bets (not raises)", () => {
      const result = sanitizeBetString("2.5x", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Multiplicative size is not allowed");
    });

    it("should reject multiplier <= 1", () => {
      const result = sanitizeBetString("1x", true);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Multiplier must be greater than 1");
    });

    it("should reject invalid multiplier format", () => {
      const result = sanitizeBetString("abcx", true);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Invalid multiplicative size");
    });
  });

  describe("All-in bets (a)", () => {
    it("should validate all-in", () => {
      const result = sanitizeBetString("a", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("a");
    });

    it("should handle all-in in combination", () => {
      const result = sanitizeBetString("50, a", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("50, a");
    });
  });

  describe("Constant addition bets (c)", () => {
    it("should validate constant addition", () => {
      const result = sanitizeBetString("100c", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("100c");
    });

    it("should validate constant with raise cap", () => {
      const result = sanitizeBetString("20c3r", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("20c3r");
    });

    it("should reject raise cap for non-raises", () => {
      const result = sanitizeBetString("20c3r", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Addition with raise cap is not allowed");
    });

    it("should reject non-integer constant", () => {
      const result = sanitizeBetString("100.5c", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Addition size must be an integer");
    });

    it("should reject invalid raise cap", () => {
      const result = sanitizeBetString("100c0r", true);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Raise cap must be a positive integer");
    });

    it("should reject raise cap too large", () => {
      const result = sanitizeBetString("100c101r", true);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Raise cap too large");
    });

    it("should reject invalid constant format", () => {
      const result = sanitizeBetString("100cc", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Invalid additive size");
    });
  });

  describe("Geometric bets (e)", () => {
    it("should validate geometric with number", () => {
      const result = sanitizeBetString("3e", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("3e");
    });

    it("should validate auto street geometric (empty before e)", () => {
      const result = sanitizeBetString("e", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("e");
    });

    it("should validate geometric with limit", () => {
      const result = sanitizeBetString("2e200", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("2e200");
    });

    it("should validate geometric with both empty", () => {
      const result = sanitizeBetString("e", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("e");
    });

    it("should reject non-integer geometric size", () => {
      const result = sanitizeBetString("2.5e", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Geometric size must be a positive integer");
    });

    it("should reject zero geometric size", () => {
      const result = sanitizeBetString("0e", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Geometric size must be a positive integer");
    });

    it("should reject geometric size too large", () => {
      const result = sanitizeBetString("101e", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Geometric size too large");
    });

    it("should reject invalid geometric format", () => {
      const result = sanitizeBetString("ee", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Invalid geometric size");
    });
  });

  describe("Mixed formats", () => {
    it("should validate mix of pot percentage and all-in", () => {
      const result = sanitizeBetString("33, 50, 75, a", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("33, 50, 75, a");
    });

    it("should validate mix of all formats for raises", () => {
      const result = sanitizeBetString("50, 2.5x, 100c, 3e, a", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("50, 2.5x, 100c, 3e, a");
    });

    it("should validate geometric with limit in combination", () => {
      const result = sanitizeBetString("33, 2e200, a", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("33, 2e200, a");
    });

    it("should validate constant with raise cap in combination", () => {
      const result = sanitizeBetString("50, 20c3r, 2.5x", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("50, 20c3r, 2.5x");
    });
  });

  describe("Empty and edge cases", () => {
    it("should accept empty string", () => {
      const result = sanitizeBetString("", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("");
    });

    it("should accept whitespace-only string", () => {
      const result = sanitizeBetString("   ", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("");
    });

    it("should reject empty element in list", () => {
      const result = sanitizeBetString("50, , 75", false);
      expect(result.valid).toBe(false);
      expect(result.s).toContain("Found empty string");
    });

    it("should handle trailing comma", () => {
      const result = sanitizeBetString("50, 75,", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("50, 75");
    });
  });

  describe("Real-world examples from specification", () => {
    it('should handle example: "50" for 50% pot bet', () => {
      const result = sanitizeBetString("50", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("50");
    });

    it('should handle example: "2.5x" for 2.5x previous bet raise', () => {
      const result = sanitizeBetString("2.5x", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("2.5x");
    });

    it('should handle example: "a" for all-in', () => {
      const result = sanitizeBetString("a", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("a");
    });

    it('should handle example: "100c" for constant addition', () => {
      const result = sanitizeBetString("100c", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("100c");
    });

    it('should handle example: "20c3r" for constant with raise cap', () => {
      const result = sanitizeBetString("20c3r", true);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("20c3r");
    });

    it('should handle example: "3e" for geometric sizing', () => {
      const result = sanitizeBetString("3e", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("3e");
    });

    it('should handle example: "2e200" for geometric with max percentage', () => {
      const result = sanitizeBetString("2e200", false);
      expect(result.valid).toBe(true);
      expect(result.s).toBe("2e200");
    });
  });
});

describe("formatBetString logic (testing the transformation)", () => {
  // Helper function that mimics the formatBetString in RunSolver.vue
  const formatBetString = (betStr: string, isRaise: boolean): string => {
    if (betStr === "") return "";
    const sanitized = sanitizeBetString(betStr, isRaise);
    if (!sanitized.valid) {
      throw new Error(sanitized.s);
    }
    // Add % suffix to pot-relative bets that don't have special formats
    return sanitized.s
      .split(",")
      .map((e) => e.trim())
      .map((e) => {
        if (
          e === "a" ||
          e.includes("x") ||
          e.includes("c") ||
          e.includes("r") ||
          e.includes("e")
        ) {
          return e;
        }
        return e + "%";
      })
      .join(", "); // Note: Join with ', ' to preserve spaces
  };

  describe("Percentage suffix addition", () => {
    it("should add % to simple pot percentage", () => {
      expect(formatBetString("50", false)).toBe("50%");
    });

    it("should add % to multiple pot percentages", () => {
      expect(formatBetString("33, 50, 75", false)).toBe("33%, 50%, 75%");
    });

    it("should add % to decimal pot percentages", () => {
      expect(formatBetString("33.5", false)).toBe("33.5%");
    });
  });

  describe("Special format preservation", () => {
    it("should NOT add % to multiplier (contains x)", () => {
      expect(formatBetString("2.5x", true)).toBe("2.5x");
    });

    it("should NOT add % to all-in (equals a)", () => {
      expect(formatBetString("a", false)).toBe("a");
    });

    it("should NOT add % to constant (contains c)", () => {
      expect(formatBetString("100c", false)).toBe("100c");
    });

    it("should NOT add % to constant with raise cap (contains c and r)", () => {
      expect(formatBetString("20c3r", true)).toBe("20c3r");
    });

    it("should NOT add % to geometric (contains e)", () => {
      expect(formatBetString("3e", false)).toBe("3e");
    });

    it("should NOT add % to auto street geometric (contains e)", () => {
      expect(formatBetString("e", false)).toBe("e");
    });

    it("should NOT add % to geometric with limit (contains e)", () => {
      expect(formatBetString("2e200", false)).toBe("2e200");
    });
  });

  describe("Mixed format handling", () => {
    it("should correctly format mix of pot % and all-in", () => {
      expect(formatBetString("33, 50, a", false)).toBe("33%, 50%, a");
    });

    it("should correctly format all special formats in one string", () => {
      expect(formatBetString("50, 2.5x, 100c, 3e, a", true)).toBe(
        "50%, 2.5x, 100c, 3e, a"
      );
    });

    it("should correctly format geometric with limit in mix", () => {
      expect(formatBetString("33, 2e200, a", false)).toBe("33%, 2e200, a");
    });

    it("should correctly format constant with raise cap in mix", () => {
      expect(formatBetString("50, 20c3r", true)).toBe("50%, 20c3r");
    });
  });

  describe("Edge case: CRITICAL - geometric with limit should not get %", () => {
    it("should preserve 2e200 exactly (not add %)", () => {
      const result = formatBetString("2e200", false);
      expect(result).toBe("2e200");
      expect(result).not.toBe("2e200%");
    });

    it("should preserve e100 exactly (not add %)", () => {
      const result = formatBetString("e100", false);
      expect(result).toBe("e100");
      expect(result).not.toBe("e100%");
    });
  });

  describe("Empty string handling", () => {
    it("should return empty string for empty input", () => {
      expect(formatBetString("", false)).toBe("");
    });
  });

  describe("Error throwing for invalid input", () => {
    it("should throw error for invalid bet string", () => {
      expect(() => formatBetString("abc", false)).toThrow("Invalid");
    });

    it("should throw error for multiplier in non-raise", () => {
      expect(() => formatBetString("2.5x", false)).toThrow(
        "Multiplicative size is not allowed"
      );
    });
  });
});

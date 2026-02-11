import { expect, test, describe } from "bun:test";
import { clamp } from "./math";

describe("Math Utils", () => {
  describe("clamp", () => {
    test("returns value when within range", () => {
      expect(clamp(5, 1, 10)).toBe(5);
    });

    test("returns min when value is less than min", () => {
      expect(clamp(0, 1, 10)).toBe(1);
    });

    test("returns max when value is greater than max", () => {
      expect(clamp(11, 1, 10)).toBe(10);
    });

    test("handles negative numbers", () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-11, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    test("handles zero range", () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(0, 5, 5)).toBe(5);
      expect(clamp(10, 5, 5)).toBe(5);
    });
  });
});

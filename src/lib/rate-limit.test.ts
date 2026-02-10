import { describe, expect, test, spyOn, afterEach } from "bun:test";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  afterEach(() => {
    // Restore any spies
    spyOn(Date, "now").mockRestore();
  });

  test("should allow requests within limit", () => {
    const limiter = new RateLimiter(1000, 3);
    expect(limiter.check("user1")).toBe(true);
    expect(limiter.check("user1")).toBe(true);
    expect(limiter.check("user1")).toBe(true);
  });

  test("should block requests exceeding limit", () => {
    const limiter = new RateLimiter(1000, 2);
    expect(limiter.check("user2")).toBe(true);
    expect(limiter.check("user2")).toBe(true);
    expect(limiter.check("user2")).toBe(false);
  });

  test("should allow requests after window expires", () => {
    const startTime = 1000000;
    const windowMs = 1000;
    const limiter = new RateLimiter(windowMs, 1);

    const nowSpy = spyOn(Date, "now").mockReturnValue(startTime);
    expect(limiter.check("user3")).toBe(true);
    expect(limiter.check("user3")).toBe(false);

    // Move time forward past window
    nowSpy.mockReturnValue(startTime + windowMs + 1);
    expect(limiter.check("user3")).toBe(true);
  });

  test("should track different keys separately", () => {
    const limiter = new RateLimiter(1000, 1);
    expect(limiter.check("user4")).toBe(true);
    expect(limiter.check("user5")).toBe(true);
    expect(limiter.check("user4")).toBe(false);
    expect(limiter.check("user5")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { getReconnectDelayMs } from "./reconnect";

describe("getReconnectDelayMs", () => {
  it("uses exponential backoff", () => {
    expect(getReconnectDelayMs(0)).toBe(500);
    expect(getReconnectDelayMs(1)).toBe(1000);
    expect(getReconnectDelayMs(2)).toBe(2000);
  });

  it("caps reconnect delay", () => {
    expect(getReconnectDelayMs(10)).toBe(10_000);
  });
});

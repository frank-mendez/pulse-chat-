import { describe, expect, it } from "vitest";

import { createEntityId } from "./id.js";

describe("createEntityId", () => {
  it("creates a stable prefixed id", () => {
    expect(createEntityId("msg", () => "A-B-C")).toBe("msg_abc");
  });

  it("rejects invalid prefixes", () => {
    expect(() => createEntityId("Bad", () => "abc")).toThrow("Invalid id prefix");
  });

  it("rejects empty random values", () => {
    expect(() => createEntityId("msg", () => "")).toThrow("empty value");
  });
});

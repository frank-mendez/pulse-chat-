import { describe, expect, it } from "vitest";

import { parseJsonMessage, readIncomingType } from "./message-parser.js";

describe("parseJsonMessage", () => {
  it("parses valid JSON messages", () => {
    expect(parseJsonMessage('{"type":"ping","payload":{}}')).toEqual({
      ok: true,
      value: {
        type: "ping",
        payload: {},
      },
    });
  });

  it("rejects invalid JSON", () => {
    expect(parseJsonMessage("{")).toEqual({
      ok: false,
      reason: "INVALID_JSON",
    });
  });
});

describe("readIncomingType", () => {
  it("reads a string event type from unknown input", () => {
    expect(readIncomingType({ type: "join", payload: {} })).toBe("join");
  });

  it("returns undefined when the type is absent", () => {
    expect(readIncomingType({ payload: {} })).toBeUndefined();
  });
});

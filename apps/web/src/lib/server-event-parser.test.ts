import { SERVER_EVENT_TYPES } from "@pulse-chat/contracts";
import { describe, expect, it } from "vitest";

import { parseServerEvent } from "./server-event-parser";

describe("parseServerEvent", () => {
  it("parses a valid server event", () => {
    expect(
      parseServerEvent(
        JSON.stringify({
          type: SERVER_EVENT_TYPES.PONG,
          payload: {
            sentAt: "2026-07-17T12:00:00.000Z",
          },
        }),
      ),
    ).toEqual({
      ok: true,
      event: {
        type: SERVER_EVENT_TYPES.PONG,
        payload: {
          sentAt: "2026-07-17T12:00:00.000Z",
        },
      },
    });
  });

  it("rejects invalid JSON", () => {
    expect(parseServerEvent("{")).toEqual({
      ok: false,
      message: "Server sent invalid JSON.",
    });
  });
});

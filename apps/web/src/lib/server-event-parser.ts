import { serverToClientEventSchema, type ServerToClientEvent } from "@pulse-chat/contracts";

export type ParseServerEventResult =
  | {
      readonly ok: true;
      readonly event: ServerToClientEvent;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export const parseServerEvent = (data: unknown): ParseServerEventResult => {
  if (typeof data !== "string") {
    return {
      ok: false,
      message: "Server sent an unsupported message.",
    };
  }

  try {
    const parsedJson: unknown = JSON.parse(data);
    const parsedEvent = serverToClientEventSchema.safeParse(parsedJson);

    if (!parsedEvent.success) {
      return {
        ok: false,
        message: "Server sent an invalid event.",
      };
    }

    return {
      ok: true,
      event: parsedEvent.data,
    };
  } catch {
    return {
      ok: false,
      message: "Server sent invalid JSON.",
    };
  }
};

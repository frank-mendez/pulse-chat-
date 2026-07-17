import { type RawData } from "ws";

export type ParseMessageResult =
  | {
      readonly ok: true;
      readonly value: unknown;
    }
  | {
      readonly ok: false;
      readonly reason: "UNSUPPORTED_DATA" | "INVALID_JSON";
    };

const rawDataToText = (data: RawData): string | undefined => {
  if (typeof data === "string") {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }

  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }

  return undefined;
};

export const parseJsonMessage = (data: RawData): ParseMessageResult => {
  const text = rawDataToText(data);

  if (text === undefined) {
    return {
      ok: false,
      reason: "UNSUPPORTED_DATA",
    };
  }

  try {
    const value: unknown = JSON.parse(text);
    return {
      ok: true,
      value,
    };
  } catch {
    return {
      ok: false,
      reason: "INVALID_JSON",
    };
  }
};

export const readIncomingType = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return undefined;
  }

  const eventType = value.type;
  return typeof eventType === "string" ? eventType : undefined;
};

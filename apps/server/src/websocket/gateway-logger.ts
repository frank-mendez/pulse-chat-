export type GatewayLogger = {
  readonly info: (message: string, details?: unknown) => void;
  readonly warn: (message: string, details?: unknown) => void;
  readonly error: (message: string, details?: unknown) => void;
};

export const silentGatewayLogger: GatewayLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

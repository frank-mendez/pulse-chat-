import { serverToClientEventSchema, type ServerToClientEvent } from "@pulse-chat/contracts";
import { WebSocket } from "ws";

export const sendEvent = (
  socket: WebSocket,
  event: ServerToClientEvent,
  onSent?: () => void,
): boolean => {
  if (socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const parsedEvent = serverToClientEventSchema.parse(event);
  socket.send(JSON.stringify(parsedEvent), () => {
    onSent?.();
  });
  return true;
};

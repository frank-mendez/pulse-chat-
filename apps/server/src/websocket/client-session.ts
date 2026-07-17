import { type PublicUser } from "@pulse-chat/contracts";
import { type WebSocket } from "ws";

export type ClientSession = {
  readonly clientId: string;
  readonly socket: WebSocket;
  isAlive: boolean;
  user: PublicUser;
};

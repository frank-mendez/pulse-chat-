import { type User } from "@pulse-chat/contracts";

import { type Clock, type IdFactory } from "../chat/chat.service.js";

export type RegisterUserInput = {
  readonly clientId: string;
  readonly username: string;
};

export type RegisterUserResult =
  | {
      readonly ok: true;
      readonly user: User;
      readonly alreadyRegistered: boolean;
    }
  | {
      readonly ok: false;
      readonly code: "USERNAME_TAKEN";
      readonly message: string;
    };

export type UsersService = {
  readonly registerClient: (input: RegisterUserInput) => RegisterUserResult;
  readonly unregisterClient: (clientId: string) => User | undefined;
  readonly getUserByClientId: (clientId: string) => User | undefined;
  readonly listOnlineUsers: () => readonly User[];
};

export type UsersServiceOptions = {
  readonly createId: IdFactory;
  readonly now: Clock;
};

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

export const createUsersService = ({ createId, now }: UsersServiceOptions): UsersService => {
  const usersByClientId = new Map<string, User>();
  const clientIdByUsername = new Map<string, string>();

  const unregisterClient = (clientId: string): User | undefined => {
    const existingUser = usersByClientId.get(clientId);

    if (existingUser === undefined) {
      return undefined;
    }

    usersByClientId.delete(clientId);
    clientIdByUsername.delete(normalizeUsername(existingUser.username));
    return existingUser;
  };

  const registerClient = (input: RegisterUserInput): RegisterUserResult => {
    const username = input.username.trim();
    const normalizedUsername = normalizeUsername(username);
    const existingClientId = clientIdByUsername.get(normalizedUsername);

    if (existingClientId !== undefined && existingClientId !== input.clientId) {
      return {
        ok: false,
        code: "USERNAME_TAKEN",
        message: "That username is already connected.",
      };
    }

    const existingUser = usersByClientId.get(input.clientId);

    if (
      existingUser !== undefined &&
      normalizeUsername(existingUser.username) === normalizedUsername
    ) {
      return {
        ok: true,
        user: existingUser,
        alreadyRegistered: true,
      };
    }

    if (existingUser !== undefined) {
      unregisterClient(input.clientId);
    }

    const user: User = {
      id: createId("user"),
      username,
      joinedAt: now(),
    };

    usersByClientId.set(input.clientId, user);
    clientIdByUsername.set(normalizedUsername, input.clientId);

    return {
      ok: true,
      user,
      alreadyRegistered: false,
    };
  };

  return {
    registerClient,
    unregisterClient,
    getUserByClientId: (clientId) => usersByClientId.get(clientId),
    listOnlineUsers: () =>
      [...usersByClientId.values()].sort((left, right) =>
        left.username.localeCompare(right.username),
      ),
  };
};

import { type LoginRequest, type PublicUser, type RegisterRequest } from "@pulse-chat/contracts";

import { type Clock, type IdFactory } from "../chat/chat.service.js";
import { type AppRepository } from "../repositories/app-repository.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createSessionToken, hashSessionToken } from "./session-token.js";

export type AuthenticatedSession = {
  readonly user: PublicUser;
  readonly token: string;
  readonly expiresAt: string;
};

export type AuthServiceResult =
  | {
      readonly ok: true;
      readonly session: AuthenticatedSession;
    }
  | {
      readonly ok: false;
      readonly code: "USERNAME_TAKEN" | "INVALID_CREDENTIALS";
      readonly message: string;
    };

export type AuthService = {
  readonly register: (input: RegisterRequest) => Promise<AuthServiceResult>;
  readonly login: (input: LoginRequest) => Promise<AuthServiceResult>;
  readonly logout: (token: string) => Promise<void>;
  readonly authenticateToken: (token: string | undefined) => Promise<PublicUser | undefined>;
};

export type AuthServiceOptions = {
  readonly repository: AppRepository;
  readonly createId: IdFactory;
  readonly now: Clock;
  readonly sessionTtlDays: number;
};

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

const createAuthenticatedSession = async (
  repository: AppRepository,
  createId: IdFactory,
  now: Clock,
  sessionTtlDays: number,
  user: PublicUser,
): Promise<AuthenticatedSession> => {
  const token = createSessionToken();
  const createdAt = now();
  const expiresAt = addDays(createdAt, sessionTtlDays);

  await repository.createSession({
    id: createId("session"),
    userId: user.id,
    tokenHash: hashSessionToken(token),
    createdAt,
    expiresAt,
  });

  return {
    user,
    token,
    expiresAt,
  };
};

export const createAuthService = ({
  repository,
  createId,
  now,
  sessionTtlDays,
}: AuthServiceOptions): AuthService => ({
  register: async (input) => {
    const existingUser = await repository.findUserWithPasswordByUsername(input.username);

    if (existingUser !== undefined) {
      return {
        ok: false,
        code: "USERNAME_TAKEN",
        message: "That username is already registered.",
      };
    }

    const createdAt = now();
    const user = await repository.createUser({
      id: createId("user"),
      username: input.username.trim(),
      displayName: input.displayName.trim(),
      passwordHash: await hashPassword(input.password),
      createdAt,
      updatedAt: createdAt,
    });
    const session = await createAuthenticatedSession(
      repository,
      createId,
      now,
      sessionTtlDays,
      user,
    );

    return {
      ok: true,
      session,
    };
  },
  login: async (input) => {
    const user = await repository.findUserWithPasswordByUsername(input.username);

    if (user === undefined || !(await verifyPassword(input.password, user.passwordHash))) {
      return {
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "Username or password is incorrect.",
      };
    }

    return {
      ok: true,
      session: await createAuthenticatedSession(repository, createId, now, sessionTtlDays, user),
    };
  },
  logout: async (token) => {
    await repository.revokeSession(hashSessionToken(token), now());
  },
  authenticateToken: async (token) => {
    if (token === undefined || token.length === 0) {
      return undefined;
    }

    const session = await repository.findSessionByTokenHash(hashSessionToken(token), now());
    return session?.user;
  },
});

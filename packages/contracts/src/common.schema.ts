import { z } from "zod";

import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "./protocol.constants.js";

export const isoDateTimeSchema = z.string().datetime();

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(USERNAME_PATTERN, "Use letters, numbers, spaces, underscores, or hyphens.");

export const messageBodySchema = z.string().trim().min(MESSAGE_MIN_LENGTH).max(MESSAGE_MAX_LENGTH);

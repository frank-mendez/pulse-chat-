const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;

export const getReconnectDelayMs = (attempt: number): number => {
  const normalizedAttempt = Math.max(0, attempt);
  const exponentialDelay = BASE_DELAY_MS * 2 ** normalizedAttempt;
  return Math.min(exponentialDelay, MAX_DELAY_MS);
};

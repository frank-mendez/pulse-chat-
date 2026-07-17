const USERNAME_STORAGE_KEY = "pulse-chat.username";

export const saveUsername = (username: string): void => {
  window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
};

export const readSavedUsername = (): string | undefined => {
  const savedUsername = window.localStorage.getItem(USERNAME_STORAGE_KEY);
  return savedUsername === null || savedUsername.trim().length === 0 ? undefined : savedUsername;
};

export const clearSavedUsername = (): void => {
  window.localStorage.removeItem(USERNAME_STORAGE_KEY);
};

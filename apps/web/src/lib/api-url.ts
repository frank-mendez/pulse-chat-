export const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL.length > 0) {
    return import.meta.env.VITE_API_URL;
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
};

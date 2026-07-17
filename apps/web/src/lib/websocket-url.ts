export const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL !== undefined && import.meta.env.VITE_WS_URL.length > 0) {
    return import.meta.env.VITE_WS_URL;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.hostname}:3000/ws`;
};

import { loadConfig } from "./config/app-config.js";
import { createPulseChatServer } from "./server/create-pulse-chat-server.js";

const server = createPulseChatServer(loadConfig());

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  server.app.log.info({ signal }, "Shutting down PulseChat server.");
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});

process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});

await server.start();

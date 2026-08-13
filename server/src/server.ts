import http from "http";

import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { initializeSocket, getIO } from "./socket";
import { logger } from "./common/logger";

const PORT = env.PORT || 5000;

let server: http.Server | undefined;
let isShuttingDown = false;

async function bootstrap() {
  try {
    await connectDatabase();

    server = http.createServer(app);

    initializeSocket(server);

    server.listen(PORT, () => {
      logger.info({ port: PORT }, "Server started");
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info({ signal }, "Graceful shutdown started");

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      logger.info("HTTP server closed");
    }

    try {
      const io = getIO();

      await new Promise<void>((resolve) => {
        io.close(() => {
          resolve();
        });
      });

      logger.info("Socket.IO server closed");
    } catch (error) {
      logger.warn(
        { err: error },
        "Socket.IO was not initialized or could not be closed",
      );
    }

    await disconnectDatabase();

    logger.info("Graceful shutdown completed");

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Graceful shutdown failed");

    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

bootstrap();

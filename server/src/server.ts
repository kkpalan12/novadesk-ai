import http from "http";

import app from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { initializeSocket } from "./socket";
import { logger } from "./common/logger";

const PORT = env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(PORT, () => {
      logger.info({ port: PORT }, "Server started");
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

bootstrap();

import http from "http";

import app from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { initializeSocket } from "./socket";

const PORT = env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();

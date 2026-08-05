import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

import http from "http";

import { initializeSocket } from "./socket";

const PORT = env.PORT || 5000;

/**
 * Connect Database
 */
connectDatabase();

/**
 * Create HTTP Server
 */
const server = http.createServer(app);

/**
 * Initialize Socket.IO
 */
initializeSocket(server);

/**
 * Start Server
 */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

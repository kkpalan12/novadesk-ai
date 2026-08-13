import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../common/logger";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);

    logger.info("MongoDB connected");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed");
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();

    logger.info("MongoDB disconnected");
  } catch (error) {
    logger.error({ err: error }, "MongoDB disconnection failed");

    throw error;
  }
};

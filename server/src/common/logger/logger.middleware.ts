import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "./logger";

export const loggerMiddleware = pinoHttp({
  logger,

  genReqId: () => randomUUID(),

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed (${res.statusCode})`;
  },

  customErrorMessage(req, res) {
    return `${req.method} ${req.url} failed (${res.statusCode})`;
  },
});

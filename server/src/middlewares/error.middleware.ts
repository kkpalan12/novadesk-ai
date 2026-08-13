import { Request, Response, NextFunction } from "express";
import multer from "multer";

import { AppError } from "../common/errors/AppError";
import { logger } from "../common/logger";

interface RequestBodyError extends Error {
  type?: string;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestError = err as RequestBodyError;

  if (requestError.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body too large",
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size cannot exceed 5 MB",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid file upload",
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error({ err }, "Unhandled application error");

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

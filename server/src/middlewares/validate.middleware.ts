import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

import { BadRequestError } from "../common/errors/BadRequestError";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { logger } from "../common/logger";

export const validate =
  (schema: ZodSchema, options?: { statusCode?: 400 | 401 }) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const payload = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    try {
      schema.parse(payload);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.debug(
          {
            method: req.method,
            url: req.originalUrl,
            issues: error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          "Request validation failed",
        );

        const message = error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");

        if (options?.statusCode === 401) {
          next(new UnauthorizedError(message));
          return;
        }

        next(new BadRequestError(message));
        return;
      }

      next(error);
    }
  };

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

import { BadRequestError } from "../common/errors/BadRequestError";
import { logger } from "../common/logger";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
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

        return next(
          new BadRequestError(
            error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join(", "),
          ),
        );
      }

      next(error);
    }
  };

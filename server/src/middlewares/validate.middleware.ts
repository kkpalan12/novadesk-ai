import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "../common/errors/BadRequestError";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      throw new BadRequestError(
        result.error.issues[0].message
      );
    }

    req.body = result.data;

    next();
  };
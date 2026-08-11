import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { BadRequestError } from "../common/errors/BadRequestError";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const payload = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    console.log("========== VALIDATION ==========");
    console.log("URL:", req.originalUrl);
    console.log("BODY:", req.body);
    console.log("PARAMS:", req.params);
    console.log("QUERY:", req.query);

    try {
      schema.parse(payload);

      console.log("✅ Validation Passed");

      next();
    } catch (error) {
      console.log("❌ Validation Failed");

      if (error instanceof ZodError) {
        console.log(JSON.stringify(error.issues, null, 2));

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

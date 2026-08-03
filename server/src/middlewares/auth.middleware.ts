import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Access token missing");
  }

  const token = authHeader.split(" ")[1];

  req.user = verifyAccessToken(token);

  next();
};
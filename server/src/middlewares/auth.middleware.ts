import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { verifyAccessToken } from "../utils/jwt";
import { UserRole } from "../common/constants/roles";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Access token missing");
  }

  const token = authHeader.split(" ")[1];

  req.user = verifyAccessToken(token);

  next();
};
export const authorize = (...roles: UserRole[]) => {
  return (
    req: Request,

    res: Response,

    next: NextFunction,
  ) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw new UnauthorizedError("Access denied");
    }

    next();
  };
};

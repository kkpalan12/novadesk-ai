import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { UserRole } from "../common/constants/roles";

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new UnauthorizedError("Access denied");
    }

    next();
  };

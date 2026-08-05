import { Request, Response, NextFunction } from "express";
import { UserRole } from "../common/constants/roles";
import { ForbiddenError } from "../common/errors/ForbiddenError";

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError("Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Access denied"));
    }

    next();
  };

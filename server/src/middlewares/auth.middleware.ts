import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { UserRole } from "../common/constants/roles";
import { UserRepository } from "../repositories/user.repository";
import { UserMapper } from "../mappers/user.mapper";

interface TokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
}

const userRepository = new UserRepository();

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Access token is required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    const user = await userRepository.findActiveById(payload.userId);

    if (!user) {
      return next(new UnauthorizedError("User not found"));
    }

    req.user = UserMapper.toAuthUser(user);

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
};

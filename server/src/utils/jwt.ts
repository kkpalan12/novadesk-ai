import jwt, {
  SignOptions,
  JwtPayload as JwtLibraryPayload,
} from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../config/env";

const JWT_ALGORITHM = "HS256" as const;

export interface JwtPayload extends JwtLibraryPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: JWT_ALGORITHM,
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: JWT_ALGORITHM,
  };

  return jwt.sign(
    {
      ...payload,
      jti: randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    options,
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as JwtPayload;
};

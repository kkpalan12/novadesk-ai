import "express-serve-static-core";
import { UserRole } from "../common/constants/roles";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      role: UserRole;
    };

    file?: Express.Multer.File;

    files?: Express.Multer.File[];
  }
}

export {};

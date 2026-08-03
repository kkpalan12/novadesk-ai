import { User } from "../models/user.model"; // Your User type

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
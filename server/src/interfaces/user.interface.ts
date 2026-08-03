import { Document } from "mongoose";
import { UserRole } from "../common/constants/roles";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

import { UserRole } from "../common/constants/roles";

export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

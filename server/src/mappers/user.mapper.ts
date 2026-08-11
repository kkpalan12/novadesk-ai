import { AuthUser } from "../types/auth-user";
import { IUser } from "../interfaces/user.interface";

export class UserMapper {
  static toAuthUser(user: IUser & { _id: unknown }): AuthUser {
    return {
      userId: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
  }
}

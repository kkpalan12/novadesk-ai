import { UserRepository } from "../repositories/user.repository";
import { UpdateProfileDto } from "../dto/user/update-profile.dto";
import { NotFoundError } from "../common/errors/NotFoundError";
import { sanitizeUser } from "../utils/sanitizeUser";
import bcrypt from "bcrypt";
import { ChangePasswordDto } from "../dto/user/change-password.dto";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { ConflictError } from "../common/errors/ConflictError";
export class UserService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // =========================================
  // Update My Profile
  // =========================================

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userRepository.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          ...(data.firstName !== undefined && {
            firstName: data.firstName,
          }),

          ...(data.lastName !== undefined && {
            lastName: data.lastName,
          }),
        },
      },
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return sanitizeUser(user);
  }
  // =========================================
  // Change Password
  // =========================================

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(
      data.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new ConflictError(
        "New password must be different from current password",
      );
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.userRepository.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          password: hashedPassword,
          refreshToken: null,
        },
      },
    );

    return {
      message: "Password changed successfully",
    };
  }
}

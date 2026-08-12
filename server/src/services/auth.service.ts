import bcrypt from "bcrypt";

import { UserRepository } from "../repositories/user.repository";
import { RegisterDto } from "../dto/auth/register.dto";
import { LoginDto } from "../dto/auth/login.dto";

import { ConflictError } from "../common/errors/ConflictError";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

import { sanitizeUser } from "../utils/sanitizeUser";
import crypto from "crypto";

import { ForgotPasswordDto } from "../dto/auth/forgot-password.dto";
import { ResetPasswordDto } from "../dto/auth/reset-password.dto";
import { BadRequestError } from "../common/errors/BadRequestError";

export class AuthService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(userData.email);

    if (existingUser) {
      throw new ConflictError("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.userRepository.create({
      ...userData,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
    });

    return sanitizeUser(user);
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email.toLowerCase());

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const payload = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);

    const refreshToken = generateRefreshToken(payload);

    await this.userRepository.updateRefreshToken(
      String(user._id),
      refreshToken,
    );

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token missing");
    }

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.userRepository.findByRefreshToken(refreshToken);

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const accessToken = generateAccessToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
    };
  }
  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token missing");
    }

    try {
      const payload = verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findByRefreshToken(refreshToken);

      if (!user) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      await this.userRepository.clearRefreshToken(String(user._id));

      return {
        message: "Logged out successfully",
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError("Invalid refresh token");
    }
  }
  async forgotPassword(data: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(
      data.email.toLowerCase(),
    );

    /*
     * Do not reveal whether an email exists.
     */
    if (!user) {
      return {
        message:
          "If an account exists with this email, a password reset link has been generated.",
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.updateOne(
      {
        _id: user._id,
      },
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires,
      },
    );

    /*
     * Temporary development response.
     *
     * Production email delivery will replace this.
     */
    return {
      message:
        "If an account exists with this email, a password reset link has been generated.",

      resetToken,
    };
  }
  async resetPassword(data: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");

    const user = await this.userRepository.updateOne(
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          $gt: new Date(),
        },
      },
      {
        password: await bcrypt.hash(data.password, 10),
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null,
      },
    );

    if (!user) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    return {
      message: "Password reset successfully",
    };
  }
}

import { FilterQuery, UpdateQuery } from "mongoose";
import { IUser } from "../interfaces/user.interface";
import { User } from "../models/user.model";

export class UserRepository {

  /**
   * Create a new user
   */
  async create(userData: Partial<IUser>) {
    return await User.create(userData);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await User.findOne({
      email: email.toLowerCase(),
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return await User.findById(id);
  }

  /**
   * Update refresh token
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string
  ) {
    return await User.findByIdAndUpdate(
      userId,
      {
        refreshToken,
      },
      {
        new: true,
      }
    );
  }

  /**
   * Generic update
   */
  async updateOne(
    filter: FilterQuery<IUser>,
    update: UpdateQuery<IUser>
  ) {
    return await User.findOneAndUpdate(
      filter,
      update,
      {
        new: true,
      }
    );
  }

  /**
   * Delete user
   */
  async deleteById(id: string) {
    return await User.findByIdAndDelete(id);
  }
}
import { ClientSession, FilterQuery, UpdateQuery } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { IUser } from "../interfaces/user.interface";
import { User } from "../models/user.model";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Create User
   */
  async create(userData: Partial<IUser>, session?: ClientSession) {
    return super.create(userData, session);
  }

  /**
   * Find User By Email
   *
   * Includes password and refresh token
   * for authentication flows.
   */
  async findByEmail(email: string) {
    return this.model
      .findOne({
        email: email.toLowerCase(),
      })
      .select("+password +refreshToken")
      .exec();
  }

  /**
   * Find User By ID
   */
  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  /**
   * Update Refresh Token
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
    session?: ClientSession,
  ) {
    return this.model
      .findByIdAndUpdate(
        userId,
        {
          refreshToken,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Generic Update
   */
  async updateOne(
    filter: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(filter, update, {
        new: true,
        session,
      })
      .exec();
  }

  /**
   * Delete User
   */
  async deleteById(id: string, session?: ClientSession) {
    return this.model
      .findByIdAndDelete(id, {
        session,
      })
      .exec();
  }

  /**
   * Find User By Refresh Token
   */
  async findByRefreshToken(refreshToken: string) {
    return this.model
      .findOne({
        refreshToken,
      })
      .exec();
  }

  /**
   * Clear Refresh Token
   */
  async clearRefreshToken(userId: string, session?: ClientSession) {
    return this.model
      .findByIdAndUpdate(
        userId,
        {
          refreshToken: null,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Find Active User By ID
   */
  async findActiveById(id: string) {
    return this.model.findById(id).select("-password").exec();
  }

  /**
   * Find User By ID With Password
   *
   * Used by authentication/password flows.
   */
  async findByIdWithPassword(id: string) {
    return this.model.findById(id).select("+password +refreshToken").exec();
  }
}

import crypto from "crypto";

import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";
import { UserRepository } from "../../../repositories/user.repository";

describe("POST /api/v1/auth/reset-password", () => {
  const endpoint = "/api/v1/auth/reset-password";

  describe("Success", () => {
    it("should reset password using a valid reset token", async () => {
      const { user } = await AuthHelper.createAuthenticatedUser();

      const userRepository = new UserRepository();

      const resetToken = "valid-reset-token";

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await userRepository.updateOne(
        { _id: user._id },
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        },
      );

      const response = await RequestHelper.post(endpoint, {
        token: resetToken,
        password: "NewPassword@123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should reject an invalid reset token", async () => {
      const response = await RequestHelper.post(endpoint, {
        token: "invalid-reset-token",
        password: "NewPassword@123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an expired reset token", async () => {
      const { user } = await AuthHelper.createAuthenticatedUser();

      const userRepository = new UserRepository();

      const expiredToken = "expired-test-token";

      const hashedToken = crypto
        .createHash("sha256")
        .update(expiredToken)
        .digest("hex");

      await userRepository.updateOne(
        { _id: user._id },
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: new Date(Date.now() - 1000),
        },
      );

      const response = await RequestHelper.post(endpoint, {
        token: expiredToken,
        password: "NewPassword@123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should invalidate refresh token after password reset", async () => {
      const { user, refreshToken } = await AuthHelper.createAuthenticatedUser();

      const userRepository = new UserRepository();

      const resetToken = "reset-refresh-token-test";

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await userRepository.updateOne(
        { _id: user._id },
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        },
      );

      const response = await RequestHelper.post(endpoint, {
        token: resetToken,
        password: "NewPassword@123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const refreshResponse = await RequestHelper.post("/api/v1/auth/refresh", {
        refreshToken,
      });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.success).toBe(false);
    });
  });
});

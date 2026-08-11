import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";
import { UserRepository } from "../../../repositories/user.repository";

describe("POST /api/v1/auth/refresh", () => {
  const endpoint = "/api/v1/auth/refresh";

  describe("Success", () => {
    it("should generate a new access token using a valid refresh token", async () => {
      const { refreshToken } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.post(endpoint, {
        refreshToken,
      });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toBeDefined();

      expect(response.body.data.accessToken).toBeDefined();

      expect(typeof response.body.data.accessToken).toBe("string");
    });
  });

  describe("Validation", () => {
    it("should reject missing refresh token", async () => {
      const response = await RequestHelper.post(endpoint, {});

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject invalid refresh token", async () => {
      const response = await RequestHelper.post(endpoint, {
        refreshToken: "invalid-refresh-token",
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject a valid refresh token that is no longer stored", async () => {
      const { user, refreshToken } = await AuthHelper.createAuthenticatedUser();

      const userRepository = new UserRepository();

      await userRepository.clearRefreshToken(user._id);

      const response = await RequestHelper.post(endpoint, {
        refreshToken,
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });
  });
});

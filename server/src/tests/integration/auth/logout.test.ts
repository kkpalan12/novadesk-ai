import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("POST /api/v1/auth/logout", () => {
  const endpoint = "/api/v1/auth/logout";

  describe("Success", () => {
    it("should logout successfully", async () => {
      const { refreshToken } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.post(endpoint, {
        refreshToken,
      });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe("Logout successful");
    });

    it("should reject the refresh token after logout", async () => {
      const { refreshToken } = await AuthHelper.createAuthenticatedUser();

      const logoutResponse = await RequestHelper.post(endpoint, {
        refreshToken,
      });

      expect(logoutResponse.status).toBe(200);

      const refreshResponse = await RequestHelper.post("/api/v1/auth/refresh", {
        refreshToken,
      });

      expect(refreshResponse.status).toBe(401);

      expect(refreshResponse.body.success).toBe(false);
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
  });
});

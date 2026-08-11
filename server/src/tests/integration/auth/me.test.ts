import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("GET /api/v1/auth/me", () => {
  const endpoint = "/api/v1/auth/me";

  describe("Success", () => {
    it("should return current authenticated user", async () => {
      const { token, user } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(endpoint, token);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toBeDefined();

      expect(response.body.data.userId).toBeDefined();

      expect(response.body.data.userId).toBe(user._id);

      expect(response.body.data.email).toBe(user.email);

      expect(response.body.data.firstName).toBe(user.firstName);

      expect(response.body.data.lastName).toBe(user.lastName);

      expect(response.body.data.role).toBeDefined();

      expect(response.body.data.password).toBeUndefined();
    });
  });

  describe("Authorization", () => {
    it("should reject missing token", async () => {
      const response = await RequestHelper.get(endpoint);

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject invalid token", async () => {
      const response = await RequestHelper.get(endpoint, "invalid.jwt.token");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject malformed token", async () => {
      const response = await RequestHelper.get(endpoint, "abc123");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });
  });
});

import { AuthHelper } from "../../helpers/auth";

describe("POST /api/v1/auth/login", () => {
  describe("Success", () => {
    it("should login successfully", async () => {
      await AuthHelper.register({
        email: "john@test.com",
      });

      const response = await AuthHelper.login("john@test.com", "Password@123");

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toBeDefined();

      expect(response.body.data.accessToken).toBeDefined();

      expect(response.body.data.refreshToken).toBeDefined();

      expect(response.body.data.user).toBeDefined();

      expect(response.body.data.user.email).toBe("john@test.com");
    });
  });

  describe("Validation", () => {
    it("should reject invalid password", async () => {
      await AuthHelper.register({
        email: "john@test.com",
      });

      const response = await AuthHelper.login("john@test.com", "WrongPassword");

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject unknown email", async () => {
      const response = await AuthHelper.login(
        "unknown@test.com",
        "Password@123",
      );

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject invalid email format", async () => {
      const response = await AuthHelper.login("invalid-email", "Password@123");

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing email", async () => {
      const response = await AuthHelper.login("", "Password@123");

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing password", async () => {
      const response = await AuthHelper.login("john@test.com", "");

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing email and password", async () => {
      const response = await AuthHelper.login("", "");

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });
  });
});

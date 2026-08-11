import { RequestHelper } from "../../helpers/request";

describe("POST /api/v1/auth/register", () => {
  const endpoint = "/api/v1/auth/register";

  describe("Success", () => {
    it("should register a new user", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password@123",
      });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toBeDefined();

      expect(response.body.data.email).toBe("john@example.com");

      expect(response.body.data.password).toBeUndefined();
    });
  });

  describe("Validation", () => {
    it("should reject duplicate email", async () => {
      await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password@123",
      });

      const response = await RequestHelper.post(endpoint, {
        firstName: "Jane",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password@123",
      });

      expect(response.status).toBe(409);

      expect(response.body.success).toBe(false);
    });

    it("should reject invalid email", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        password: "Password@123",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject weak password", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        password: "123",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing firstName", async () => {
      const response = await RequestHelper.post(endpoint, {
        lastName: "Doe",
        email: "john@test.com",
        password: "Password@123",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing lastName", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        email: "john@test.com",
        password: "Password@123",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing email", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "Doe",
        password: "Password@123",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing password", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should trim firstName", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "   John   ",
        lastName: "Doe",
        email: "trim@test.com",
        password: "Password@123",
      });

      expect(response.status).toBe(201);

      expect(response.body.data.firstName).toBe("John");
    });

    it("should trim lastName", async () => {
      const response = await RequestHelper.post(endpoint, {
        firstName: "John",
        lastName: "   Doe   ",
        email: "trimlastname@test.com",
        password: "Password@123",
      });

      expect(response.status).toBe(201);

      expect(response.body.data.lastName).toBe("Doe");
    });
  });
});

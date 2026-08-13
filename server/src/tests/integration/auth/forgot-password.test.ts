import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("POST /api/v1/auth/forgot-password", () => {
  const endpoint = "/api/v1/auth/forgot-password";

  it("should generate a password reset token for an existing user", async () => {
    const { user } = await AuthHelper.createAuthenticatedUser();

    const response = await RequestHelper.post(endpoint, {
      email: user.email,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.message).toBeDefined();
    expect(response.body.data.resetToken).toBeDefined();
  });

  it("should not reveal whether an email exists", async () => {
    const response = await RequestHelper.post(endpoint, {
      email: "nonexistent-user@test.com",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.message).toBeDefined();
  });

  it("should reject invalid email", async () => {
    const response = await RequestHelper.post(endpoint, {
      email: "invalid-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject missing email", async () => {
    const response = await RequestHelper.post(endpoint, {});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

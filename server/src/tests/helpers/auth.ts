import request from "supertest";

import app from "../../app";

export class AuthHelper {
  static async register(overrides = {}) {
    return request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: `user-${Date.now()}@test.com`,
        password: "Password@123",
        ...overrides,
      });
  }

  static async login(email: string, password = "Password@123") {
    return request(app).post("/api/v1/auth/login").send({
      email,
      password,
    });
  }

  static async createAuthenticatedUser() {
    const registerResponse = await this.register();

    const email = registerResponse.body.data.email;

    const loginResponse = await this.login(email);

    return {
      user: registerResponse.body.data,
      token: loginResponse.body.data.accessToken,
      refreshToken: loginResponse.body.data.refreshToken,
    };
  }
}

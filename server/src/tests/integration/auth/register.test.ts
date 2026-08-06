import request from "supertest";

import app from "../../../app";

describe("POST /api/v1/auth/register", () => {
  it("should register a new user", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password@123",
    });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.email).toBe("john@example.com");
  });
});

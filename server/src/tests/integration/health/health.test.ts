import mongoose from "mongoose";

import { RequestHelper } from "../../helpers/request";

describe("Health API", () => {
  const endpoint = "/api/v1/health";

  describe("GET /api/v1/health", () => {
    it("should return API health status", async () => {
      const response = await RequestHelper.get(endpoint);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("NovaDesk API is running");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("GET /api/v1/health/ready", () => {
    it("should return ready when database is connected", async () => {
      const response = await RequestHelper.get(`${endpoint}/ready`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("NovaDesk API is ready");
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return 503 when database is not connected", async () => {
      const originalReadyState = mongoose.connection.readyState;

      Object.defineProperty(mongoose.connection, "readyState", {
        configurable: true,
        value: 0,
      });

      try {
        const response = await RequestHelper.get(`${endpoint}/ready`);

        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("NovaDesk API is not ready");
      } finally {
        Object.defineProperty(mongoose.connection, "readyState", {
          configurable: true,
          value: originalReadyState,
        });
      }
    });
  });
  it("should return standardized 404 for unknown route", async () => {
    const response = await RequestHelper.get(
      "/api/v1/this-route-does-not-exist",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Route not found: GET /api/v1/this-route-does-not-exist",
    );
  });
});

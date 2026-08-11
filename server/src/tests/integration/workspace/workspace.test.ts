import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Workspace API", () => {
  const endpoint = "/api/v1/workspaces";

  describe("POST /api/v1/workspaces", () => {
    it("should create a workspace", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.post(
        endpoint,
        {
          name: "NovaDesk Workspace",
          description: "Test workspace",
        },
        token,
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe("NovaDesk Workspace");
    });

    it("should reject unauthenticated request", async () => {
      const response = await RequestHelper.post(endpoint, {
        name: "Unauthorized Workspace",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing workspace name", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.post(
        endpoint,
        {
          description: "Workspace without name",
        },
        token,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/workspaces", () => {
    it("should return user's workspaces", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(endpoint, token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should reject unauthenticated request", async () => {
      const response = await RequestHelper.get(endpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/workspaces/:id", () => {
    it("should return workspace by id", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Workspace For Fetch",
          description: "Test workspace",
        },
        token,
      );

      expect(createResponse.status).toBe(201);

      const workspaceId = createResponse.body.data._id;

      expect(workspaceId).toBeDefined();

      const response = await RequestHelper.get(
        `${endpoint}/${workspaceId}`,
        token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(workspaceId);
    });

    it("should return 404 for non-existent workspace", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        `${endpoint}/507f1f77bcf86cd799439011`,
        token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  describe("PUT /api/v1/workspaces/:id", () => {
    it("should update a workspace", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Original Workspace",
          description: "Original description",
        },
        token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.put(
        `${endpoint}/${workspaceId}`,
        {
          name: "Updated Workspace",
          description: "Updated description",
        },
        token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Workspace");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should reject unauthenticated update", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Workspace",
        },
        token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.put(`${endpoint}/${workspaceId}`, {
        name: "Updated",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent workspace", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.put(
        `${endpoint}/507f1f77bcf86cd799439011`,
        {
          name: "Updated Workspace",
        },
        token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/workspaces/:id", () => {
    it("should delete a workspace", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Workspace To Delete",
        },
        token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.delete(
        `${endpoint}/${workspaceId}`,
        token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Workspace deleted successfully");
    });

    it("should reject unauthenticated delete", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Workspace",
        },
        token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.delete(`${endpoint}/${workspaceId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent workspace", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.delete(
        `${endpoint}/507f1f77bcf86cd799439011`,
        token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  describe("Workspace ownership isolation", () => {
    it("should not allow another user to access workspace", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const otherUser = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Private Workspace",
          description: "Owner only",
        },
        owner.token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.get(
        `${endpoint}/${workspaceId}`,
        otherUser.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should not allow another user to update workspace", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const otherUser = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Private Workspace",
        },
        owner.token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.put(
        `${endpoint}/${workspaceId}`,
        {
          name: "Hacked Workspace",
        },
        otherUser.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should not allow another user to delete workspace", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const otherUser = await AuthHelper.createAuthenticatedUser();

      const createResponse = await RequestHelper.post(
        endpoint,
        {
          name: "Private Workspace",
        },
        owner.token,
      );

      const workspaceId = createResponse.body.data._id;

      const response = await RequestHelper.delete(
        `${endpoint}/${workspaceId}`,
        otherUser.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

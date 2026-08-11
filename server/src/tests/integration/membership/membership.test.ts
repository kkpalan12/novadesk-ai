import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Membership API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const membershipEndpoint = "/api/v1/memberships";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: "Membership Test Workspace",
        description: "Workspace for membership tests",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  describe("POST /api/v1/memberships", () => {
    it("should allow workspace owner to add a member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data.workspace).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it("should reject unauthenticated request", async () => {
      const response = await RequestHelper.post(membershipEndpoint, {
        workspace: "507f1f77bcf86cd799439011",
        user: "507f1f77bcf86cd799439012",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/memberships/workspace/:workspaceId", () => {
    it("should allow workspace owner to view members", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const response = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should reject unrelated user", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should allow active member to view workspace members", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const response = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
        member.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("PUT /api/v1/memberships/:id", () => {
    it("should allow workspace owner to update membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const membershipId = membershipResponse.body.data._id;

      expect(membershipId).toBeDefined();

      const response = await RequestHelper.put(
        `${membershipEndpoint}/${membershipId}`,
        {
          role: "ADMIN",
        },
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should reject non-owner from updating membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const membershipId = membershipResponse.body.data._id;

      expect(membershipId).toBeDefined();

      const response = await RequestHelper.put(
        `${membershipEndpoint}/${membershipId}`,
        {
          role: "ADMIN",
        },
        member.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated update", async () => {
      const response = await RequestHelper.put(
        `${membershipEndpoint}/507f1f77bcf86cd799439011`,
        {
          role: "ADMIN",
        },
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/memberships/:id", () => {
    it("should allow workspace owner to remove member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const membershipId = membershipResponse.body.data._id;

      expect(membershipId).toBeDefined();

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${membershipId}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject non-owner from removing member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        membershipEndpoint,
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const membershipId = membershipResponse.body.data._id;

      expect(membershipId).toBeDefined();

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${membershipId}`,
        member.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated delete", async () => {
      const response = await RequestHelper.delete(
        `${membershipEndpoint}/507f1f77bcf86cd799439011`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

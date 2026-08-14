import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Membership API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const membershipEndpoint = "/api/v1/memberships";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Membership Test Workspace ${Date.now()}-${Math.random()}`,
        description: "Membership integration test workspace",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createMembership(
    ownerToken: string,
    workspaceId: string,
    userId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return RequestHelper.post(
      membershipEndpoint,
      {
        workspace: workspaceId,
        user: userId,
        ...overrides,
      },
      ownerToken,
    );
  }

  describe("POST /api/v1/memberships", () => {
    it("should allow workspace owner to add member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.workspace).toBe(workspace._id);
      expect(response.body.data.user).toBe(member.user._id);
      expect(response.body.data.status).toBe("ACTIVE");
    });

    it("should reject unrelated user from adding member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const unrelated = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await createMembership(
        unrelated.token,
        workspace._id,
        member.user._id,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await createMembership(
        "",
        workspace._id,
        member.user._id,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject duplicate membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const firstResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(firstResponse.status).toBe(201);

      const secondResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.success).toBe(false);
    });
    it("should reactivate a removed membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const firstResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(firstResponse.status).toBe(201);

      const membershipId = firstResponse.body.data._id;

      const removeResponse = await RequestHelper.delete(
        `${membershipEndpoint}/${membershipId}`,
        owner.token,
      );

      expect(removeResponse.status).toBe(200);

      const reAddResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(reAddResponse.status).toBe(201);
      expect(reAddResponse.body.success).toBe(true);
      expect(reAddResponse.body.data._id).toBe(membershipId);
      expect(reAddResponse.body.data.status).toBe("ACTIVE");
    });
  });

  describe("GET /api/v1/memberships/workspace/:workspaceId", () => {
    it("should allow workspace owner to view members", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membership = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(membership.status).toBe(201);

      const response = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].user._id).toBe(member.user._id);
    });

    it("should allow active member to view workspace members", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member1 = await AuthHelper.createAuthenticatedUser();
      const member2 = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      await createMembership(owner.token, workspace._id, member1.user._id);
      await createMembership(owner.token, workspace._id, member2.user._id);

      const response = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
        member1.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should reject unrelated user from viewing members", async () => {
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
  });

  describe("PUT /api/v1/memberships/:id", () => {
    it("should allow workspace owner to update membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      expect(membershipResponse.status).toBe(201);

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.put(
        `${membershipEndpoint}/${membership._id}`,
        {
          role: "ADMIN",
        },
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe("ADMIN");
    });

    it("should reject malformed membership id", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.put(
        `${membershipEndpoint}/not-a-valid-object-id`,
        {
          role: "ADMIN",
        },
        owner.token,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unrelated user from updating membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();
      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.put(
        `${membershipEndpoint}/${membership._id}`,
        {
          role: "ADMIN",
        },
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject active member from updating membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.put(
        `${membershipEndpoint}/${membership._id}`,
        {
          role: "ADMIN",
        },
        member.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated update", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.put(
        `${membershipEndpoint}/${membership._id}`,
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

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${membership._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const membersResponse = await RequestHelper.get(
        `${membershipEndpoint}/workspace/${workspace._id}`,
        owner.token,
      );

      expect(membersResponse.status).toBe(200);
      expect(membersResponse.body.data).toHaveLength(0);
    });

    it("should reject unrelated user from removing member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();
      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${membership._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject active member from removing another member", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member1 = await AuthHelper.createAuthenticatedUser();
      const member2 = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member1.user._id,
      );

      const membership2Response = await createMembership(
        owner.token,
        workspace._id,
        member2.user._id,
      );

      const membership2 = membership2Response.body.data;

      expect(membershipResponse.status).toBe(201);
      expect(membership2Response.status).toBe(201);

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${membership2._id}`,
        member1.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated delete", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();
      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await createMembership(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const membership = membershipResponse.body.data;

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${membership._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 when removing non-existing membership", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const fakeMembershipId = "507f1f77bcf86cd799439011";

      const response = await RequestHelper.delete(
        `${membershipEndpoint}/${fakeMembershipId}`,
        owner.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Comment API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Comment Test Workspace ${Date.now()}-${Math.random()}`,
        description: "Comment integration test workspace",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createProject(token: string, workspaceId: string) {
    const response = await RequestHelper.post(
      projectEndpoint,
      {
        workspace: workspaceId,
        name: `Comment Test Project ${Date.now()}-${Math.random()}`,
        description: "Comment integration test project",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createTask(token: string, projectId: string) {
    const response = await RequestHelper.post(
      `${projectEndpoint}/${projectId}/tasks`,
      {
        title: `Comment Test Task ${Date.now()}-${Math.random()}`,
        description: "Comment integration test task",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createOwnerProject() {
    const owner = await AuthHelper.createAuthenticatedUser();

    const workspace = await createWorkspace(owner.token);

    const project = await createProject(owner.token, workspace._id);

    return {
      owner,
      workspace,
      project,
    };
  }

  describe("POST /api/v1/tasks/:taskId/comments", () => {
    it("should allow workspace owner to create a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Owner comment",
        },
        owner.token,
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data.content).toBe("Owner comment");

      expect(response.body.data.task).toBe(task._id);
    });

    it("should reject unrelated user from creating a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Unauthorized comment",
        },
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Unauthenticated comment",
        },
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/tasks/:taskId/comments", () => {
    it("should allow workspace owner to view comments", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Owner comment",
        },
        owner.token,
      );

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(1);
    });

    it("should reject unrelated user", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/comments/:id", () => {
    it("should allow comment owner to update a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Original comment",
        },
        owner.token,
      );

      expect(createResponse.status).toBe(201);

      const comment = createResponse.body.data;

      const response = await RequestHelper.put(
        `/api/v1/comments/${comment._id}`,
        {
          content: "Updated comment",
        },
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.content).toBe("Updated comment");

      expect(response.body.data.isEdited).toBe(true);
    });

    it("should reject another user from updating a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const anotherUser = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Original comment",
        },
        owner.token,
      );

      const comment = createResponse.body.data;

      const response = await RequestHelper.put(
        `/api/v1/comments/${comment._id}`,
        {
          content: "Unauthorized edit",
        },
        anotherUser.token,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Original comment",
        },
        owner.token,
      );

      const comment = createResponse.body.data;

      const response = await RequestHelper.put(
        `/api/v1/comments/${comment._id}`,
        {
          content: "Unauthorized edit",
        },
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/comments/:id", () => {
    it("should allow comment owner to delete a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Comment to delete",
        },
        owner.token,
      );

      const comment = createResponse.body.data;

      const response = await RequestHelper.delete(
        `/api/v1/comments/${comment._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject another user from deleting a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const anotherUser = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Comment to protect",
        },
        owner.token,
      );

      const comment = createResponse.body.data;

      const response = await RequestHelper.delete(
        `/api/v1/comments/${comment._id}`,
        anotherUser.token,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Comment to protect",
        },
        owner.token,
      );

      const comment = createResponse.body.data;

      const response = await RequestHelper.delete(
        `/api/v1/comments/${comment._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Tenant isolation", () => {
    it("should reject access to comments from another workspace", async () => {
      const { owner, project } = await createOwnerProject();

      const otherOwner = await AuthHelper.createAuthenticatedUser();

      const otherWorkspace = await createWorkspace(otherOwner.token);

      const otherProject = await createProject(
        otherOwner.token,
        otherWorkspace._id,
      );

      const task = await createTask(otherOwner.token, otherProject._id);

      await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Private workspace comment",
        },
        otherOwner.token,
      );

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        owner.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Comment authorization", () => {
    it("should reject unrelated user from creating a comment", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Unauthorized comment",
        },
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unrelated user from viewing comments", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Private comment",
        },
        owner.token,
      );

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should allow active workspace member to create and view comments", async () => {
      const { owner, project, workspace } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      const membershipResponse = await RequestHelper.post(
        "/api/v1/memberships",
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const task = await createTask(owner.token, project._id);

      const createResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Member comment",
        },
        member.token,
      );

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);

      const getResponse = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        member.token,
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      expect(getResponse.body.data).toHaveLength(1);
    });

    it("should reject non-owner from editing another user's comment", async () => {
      const { owner, project, workspace } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      await RequestHelper.post(
        "/api/v1/memberships",
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      const task = await createTask(owner.token, project._id);

      const commentResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Owner comment",
        },
        owner.token,
      );

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const response = await RequestHelper.put(
        `/api/v1/comments/${comment._id}`,
        {
          content: "Unauthorized edit",
        },
        member.token,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject non-owner from deleting another user's comment", async () => {
      const { owner, project, workspace } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      await RequestHelper.post(
        "/api/v1/memberships",
        {
          workspace: workspace._id,
          user: member.user._id,
        },
        owner.token,
      );

      const task = await createTask(owner.token, project._id);

      const commentResponse = await RequestHelper.post(
        `/api/v1/tasks/${task._id}/comments`,
        {
          content: "Owner comment",
        },
        owner.token,
      );

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const response = await RequestHelper.delete(
        `/api/v1/comments/${comment._id}`,
        member.token,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});

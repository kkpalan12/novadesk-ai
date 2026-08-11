import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Task History API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";
  const taskEndpoint = "/api/v1/tasks";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `History Workspace ${Date.now()}-${Math.random()}`,
        description: "Task history integration test",
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
        name: `History Project ${Date.now()}-${Math.random()}`,
        description: "Task history integration test",
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
        title: `History Task ${Date.now()}-${Math.random()}`,
        description: "Task history integration test",
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

  async function addMember(
    ownerToken: string,
    workspaceId: string,
    memberUserId: string,
  ) {
    const response = await RequestHelper.post(
      "/api/v1/memberships",
      {
        workspace: workspaceId,
        user: memberUserId,
      },
      ownerToken,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  describe("GET /api/v1/tasks/:taskId/history", () => {
    it("should allow workspace owner to view task history", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `${taskEndpoint}/${task._id}/history`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should allow active workspace member to view task history", async () => {
      const { owner, workspace, project } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      await addMember(owner.token, workspace._id, member.user._id);

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `${taskEndpoint}/${task._id}/history`,
        member.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should reject user from another workspace", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `${taskEndpoint}/${task._id}/history`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `${taskEndpoint}/${task._id}/history`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existing task", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const fakeTaskId = "507f1f77bcf86cd799439011";

      const response = await RequestHelper.get(
        `${taskEndpoint}/${fakeTaskId}/history`,
        user.token,
      );

      expect(response.status).toBe(404);
    });

    it("should reject removed workspace member", async () => {
      const { owner, workspace, project } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      const membership = await addMember(
        owner.token,
        workspace._id,
        member.user._id,
      );

      const task = await createTask(owner.token, project._id);

      expect(membership._id).toBeDefined();

      const removeResponse = await RequestHelper.delete(
        `/api/v1/memberships/${membership._id}`,
        owner.token,
      );

      expect(removeResponse.status).toBe(200);

      const response = await RequestHelper.get(
        `${taskEndpoint}/${task._id}/history`,
        member.token,
      );

      expect(response.status).toBe(404);
    });
  });
});

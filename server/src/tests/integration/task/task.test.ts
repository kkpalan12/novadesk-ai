import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Task API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const taskEndpoint = "/api/v1/projects";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Task Test Workspace ${Date.now()}`,
        description: "Workspace for task tests",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createProject(token: string, workspaceId: string) {
    const response = await RequestHelper.post(
      `${taskEndpoint}`,
      {
        workspace: workspaceId,
        name: `Task Test Project ${Date.now()}`,
        description: "Project for task tests",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createTask(
    token: string,
    projectId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return RequestHelper.post(
      `${taskEndpoint}/${projectId}/tasks`,
      {
        title: `Test Task ${Date.now()}`,
        description: "Task integration test",
        priority: "MEDIUM",
        ...overrides,
      },
      token,
    );
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

  describe("POST /api/v1/projects/:projectId/tasks", () => {
    it("should allow workspace owner to create a task", async () => {
      const { owner, project } = await createOwnerProject();

      const response = await createTask(owner.token, project._id);
      console.log("TASK CREATE STATUS:", response.status);
      console.log("TASK CREATE BODY:", response.body);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.title).toContain("Test Task");
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const response = await createTask("", project._id);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject unrelated user from creating a task", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await createTask(unrelated.token, project._id);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/projects/:projectId/tasks", () => {
    it("should allow workspace owner to view tasks", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.tasks).toBeDefined();
    });

    it("should reject unrelated user", async () => {
      const { owner, project } = await createOwnerProject();

      await createTask(owner.token, project._id);

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/projects/:projectId/tasks/:id", () => {
    it("should allow workspace owner to get a task", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(task._id);
    });

    it("should reject unrelated user", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/projects/:projectId/tasks/:id", () => {
    it("should allow workspace owner to update a task", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const response = await RequestHelper.put(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        {
          title: "Updated Task",
          description: "Updated description",
        },
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Task");
    });

    it("should reject unrelated user from updating a task", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.put(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        {
          title: "Unauthorized Update",
        },
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const response = await RequestHelper.put(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        {
          title: "Unauthorized Update",
        },
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/projects/:projectId/tasks/:id", () => {
    it("should allow workspace owner to delete a task", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const response = await RequestHelper.delete(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const getResponse = await RequestHelper.get(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        owner.token,
      );

      expect(getResponse.status).toBe(404);
    });

    it("should reject unrelated user from deleting a task", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.delete(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const response = await RequestHelper.delete(
        `${taskEndpoint}/${project._id}/tasks/${task._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/projects/:projectId/tasks/:id/assign", () => {
    it("should allow workspace owner to assign a task", async () => {
      const { owner, project, workspace } = await createOwnerProject();

      const assignee = await AuthHelper.createAuthenticatedUser();

      // Assignee must belong to the same workspace.
      const membershipResponse = await RequestHelper.post(
        "/api/v1/memberships",
        {
          workspace: workspace._id,
          user: assignee.user._id,
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const response = await RequestHelper.patch(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/assign`,
        {
          assignedTo: assignee.user._id,
        },
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.assignedTo).toBeDefined();
    });

    it("should reject assigning task to user from another workspace", async () => {
      const { owner, project, workspace } = await createOwnerProject();

      const otherOwner = await AuthHelper.createAuthenticatedUser();

      const otherWorkspace = await createWorkspace(otherOwner.token);

      const assignee = await AuthHelper.createAuthenticatedUser();

      await RequestHelper.post(
        "/api/v1/memberships",
        {
          workspace: otherWorkspace._id,
          user: assignee.user._id,
        },
        otherOwner.token,
      );

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const response = await RequestHelper.patch(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/assign`,
        {
          assignedTo: assignee.user._id,
        },
        owner.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
    it("should reject unrelated user from assigning a task", async () => {
      const { owner, project } = await createOwnerProject();

      const assignee = await AuthHelper.createAuthenticatedUser();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const taskResponse = await createTask(owner.token, project._id);

      const task = taskResponse.body.data;

      const response = await RequestHelper.patch(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/assign`,
        {
          assignedTo: assignee.user._id,
        },
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const taskResponse = await createTask(owner.token, project._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const assignee = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.patch(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/assign`,
        {
          assignedTo: assignee.user._id,
        },
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Tenant isolation", () => {
    it("should reject access when task belongs to another project", async () => {
      const { owner: owner1, project: project1 } = await createOwnerProject();

      const { owner: owner2, project: project2 } = await createOwnerProject();

      const taskResponse = await createTask(owner1.token, project1._id);

      expect(taskResponse.status).toBe(201);

      const task = taskResponse.body.data;

      const response = await RequestHelper.get(
        `${taskEndpoint}/${project2._id}/tasks/${task._id}`,
        owner2.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

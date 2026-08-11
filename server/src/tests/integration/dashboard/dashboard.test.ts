import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Dashboard API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";
  const membershipEndpoint = "/api/v1/memberships";
  const dashboardEndpoint = "/api/v1/dashboard";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Dashboard Workspace ${Date.now()}-${Math.random()}`,
        description: "Workspace for dashboard tests",
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
        name: `Dashboard Project ${Date.now()}-${Math.random()}`,
        description: "Project for dashboard tests",
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
    const response = await RequestHelper.post(
      `${projectEndpoint}/${projectId}/tasks`,
      {
        title: `Dashboard Task ${Date.now()}-${Math.random()}`,
        description: "Task for dashboard tests",
        ...overrides,
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createFixture() {
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
    userId: string,
  ) {
    const response = await RequestHelper.post(
      membershipEndpoint,
      {
        workspace: workspaceId,
        user: userId,
        role: "MEMBER",
      },
      ownerToken,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function updateTaskStatus(
    token: string,
    projectId: string,
    taskId: string,
    status: string,
  ) {
    const response = await RequestHelper.put(
      `${projectEndpoint}/${projectId}/tasks/${taskId}`,
      {
        status,
      },
      token,
    );

    expect(response.status).toBe(200);

    return response.body.data;
  }

  describe("GET /api/v1/dashboard", () => {
    it("should allow authenticated owner to get dashboard", async () => {
      const { owner, project } = await createFixture();

      await createTask(owner.token, project._id);

      const response = await RequestHelper.get(dashboardEndpoint, owner.token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.tasks).toBeDefined();
      expect(response.body.data.priorities).toBeDefined();
      expect(response.body.data.myTasks).toBeDefined();
      expect(response.body.data.recentActivities).toBeDefined();
      expect(response.body.data.unreadNotifications).toBeDefined();
    });

    it("should return correct task statistics", async () => {
      const { owner, project } = await createFixture();

      // New tasks start as TODO.
      await createTask(owner.token, project._id, {
        title: "Todo Dashboard Task",
      });

      const inProgressTask = await createTask(owner.token, project._id, {
        title: "In Progress Dashboard Task",
      });

      const reviewTask = await createTask(owner.token, project._id, {
        title: "Review Dashboard Task",
      });

      const doneTask = await createTask(owner.token, project._id, {
        title: "Done Dashboard Task",
      });

      await updateTaskStatus(
        owner.token,
        project._id,
        inProgressTask._id,
        "IN_PROGRESS",
      );

      await updateTaskStatus(
        owner.token,
        project._id,
        reviewTask._id,
        "REVIEW",
      );

      await updateTaskStatus(owner.token, project._id, doneTask._id, "DONE");

      const response = await RequestHelper.get(dashboardEndpoint, owner.token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const tasks = response.body.data.tasks;

      expect(tasks.total).toBe(4);
      expect(tasks.TODO).toBe(1);
      expect(tasks.IN_PROGRESS).toBe(1);
      expect(tasks.REVIEW).toBe(1);
      expect(tasks.DONE).toBe(1);
    });

    it("should return correct priority statistics", async () => {
      const { owner, project } = await createFixture();

      await createTask(owner.token, project._id, {
        title: "Low Dashboard Task",
        priority: "LOW",
      });

      await createTask(owner.token, project._id, {
        title: "Medium Dashboard Task",
        priority: "MEDIUM",
      });

      await createTask(owner.token, project._id, {
        title: "High Dashboard Task",
        priority: "HIGH",
      });

      await createTask(owner.token, project._id, {
        title: "Critical Dashboard Task",
        priority: "CRITICAL",
      });

      const response = await RequestHelper.get(dashboardEndpoint, owner.token);

      expect(response.status).toBe(200);

      const priorities = response.body.data.priorities;

      expect(priorities.LOW).toBe(1);
      expect(priorities.MEDIUM).toBe(1);
      expect(priorities.HIGH).toBe(1);
      expect(priorities.CRITICAL).toBe(1);
    });

    it("should return my assigned tasks", async () => {
      const { owner, project } = await createFixture();

      await createTask(owner.token, project._id, {
        title: "Assigned Dashboard Task",
        assignedTo: owner.user._id,
      });

      const response = await RequestHelper.get(dashboardEndpoint, owner.token);

      expect(response.status).toBe(200);

      const myTasks = response.body.data.myTasks;

      expect(myTasks).toBeDefined();
      expect(myTasks.length).toBeGreaterThanOrEqual(1);

      expect(myTasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Assigned Dashboard Task",
          }),
        ]),
      );
    });

    it("should return recent activity", async () => {
      const { owner, project } = await createFixture();

      await createTask(owner.token, project._id, {
        title: "Activity Dashboard Task",
      });

      const response = await RequestHelper.get(dashboardEndpoint, owner.token);

      expect(response.status).toBe(200);

      expect(response.body.data.recentActivities).toBeDefined();

      expect(response.body.data.recentActivities.length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it("should return unread notification count", async () => {
      const { owner } = await createFixture();

      const response = await RequestHelper.get(dashboardEndpoint, owner.token);

      expect(response.status).toBe(200);

      expect(response.body.data.unreadNotifications).toBeDefined();

      expect(typeof response.body.data.unreadNotifications).toBe("number");
    });

    it("should allow active workspace member to get dashboard", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      await addMember(owner.token, workspace._id, member.user._id);

      const project = await createProject(owner.token, workspace._id);

      await createTask(owner.token, project._id);

      const response = await RequestHelper.get(dashboardEndpoint, member.token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.tasks.total).toBe(1);
    });

    it("should not expose another workspace data", async () => {
      const owner1 = await AuthHelper.createAuthenticatedUser();

      const owner2 = await AuthHelper.createAuthenticatedUser();

      const workspace1 = await createWorkspace(owner1.token);

      const workspace2 = await createWorkspace(owner2.token);

      const project1 = await createProject(owner1.token, workspace1._id);

      const project2 = await createProject(owner2.token, workspace2._id);

      await createTask(owner1.token, project1._id, {
        title: "Workspace 1 Task",
      });

      await createTask(owner2.token, project2._id, {
        title: "Workspace 2 Task",
      });

      const response = await RequestHelper.get(dashboardEndpoint, owner1.token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.tasks.total).toBe(1);

      expect(response.body.data.myTasks).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Workspace 2 Task",
          }),
        ]),
      );
    });

    it("should return empty dashboard for user without workspace", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(dashboardEndpoint, user.token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.tasks.total).toBe(0);

      expect(response.body.data.tasks.TODO).toBe(0);

      expect(response.body.data.tasks.IN_PROGRESS).toBe(0);

      expect(response.body.data.tasks.REVIEW).toBe(0);

      expect(response.body.data.tasks.DONE).toBe(0);

      expect(response.body.data.myTasks).toHaveLength(0);

      expect(response.body.data.recentActivities).toHaveLength(0);

      expect(response.body.data.unreadNotifications).toBe(0);
    });

    it("should reject unauthenticated request", async () => {
      const response = await RequestHelper.get(dashboardEndpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

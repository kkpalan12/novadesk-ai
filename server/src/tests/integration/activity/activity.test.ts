import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Activity API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";
  const activityEndpoint = "/api/v1";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Activity Workspace ${Date.now()}-${Math.random()}`,
        description: "Activity integration test",
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
        name: `Activity Project ${Date.now()}-${Math.random()}`,
        description: "Activity integration test",
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

  async function createActivity(
    token: string,
    projectId: string,
    overrides: Record<string, unknown> = {},
  ) {
    /**
     * Activity creation is internal-only.
     *
     * We generate activity through an action that
     * already exists in the application.
     */
    const taskResponse = await RequestHelper.post(
      `${projectEndpoint}/${projectId}/tasks`,
      {
        title: `Activity Task ${Date.now()}-${Math.random()}`,
        description: "Activity integration test",
        ...overrides,
      },
      token,
    );

    expect(taskResponse.status).toBe(201);

    return taskResponse.body.data;
  }

  describe("GET /api/v1/projects/:projectId/activity", () => {
    it("should allow workspace owner to view project activity", async () => {
      const { owner, project } = await createOwnerProject();

      await createActivity(owner.token, project._id);

      const response = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data.activities).toBeDefined();

      expect(Array.isArray(response.body.data.activities)).toBe(true);

      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it("should allow active workspace member to view project activity", async () => {
      const { owner, workspace, project } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      await addMember(owner.token, workspace._id, member.user._id);

      await createActivity(owner.token, project._id);

      const response = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        member.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data.activities).toBeDefined();
    });

    it("should reject user from another workspace", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      await createActivity(owner.token, project._id);

      const response = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      const response = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existing project", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const fakeProjectId = "507f1f77bcf86cd799439011";

      const response = await RequestHelper.get(
        `${activityEndpoint}/projects/${fakeProjectId}/activity`,
        user.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should support pagination", async () => {
      const { owner, project } = await createOwnerProject();

      await createActivity(owner.token, project._id);

      const response = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity?page=1&limit=10`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.page).toBe(1);

      expect(response.body.data.limit).toBe(10);

      expect(response.body.data.totalPages).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/v1/activities/:id", () => {
    it("should allow workspace owner to view an activity", async () => {
      const { owner, project } = await createOwnerProject();

      const task = await createActivity(owner.token, project._id);

      /**
       * Task creation generates activity.
       * Fetch project activity to obtain an activity id.
       */
      const feedResponse = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        owner.token,
      );

      expect(feedResponse.status).toBe(200);

      const activities = feedResponse.body.data.activities;

      expect(activities.length).toBeGreaterThan(0);

      const activity = activities[0];

      const response = await RequestHelper.get(
        `${activityEndpoint}/activities/${activity._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(activity._id);

      expect(task._id).toBeDefined();
    });

    it("should allow active workspace member to view an activity", async () => {
      const { owner, workspace, project } = await createOwnerProject();

      const member = await AuthHelper.createAuthenticatedUser();

      await addMember(owner.token, workspace._id, member.user._id);

      await createActivity(owner.token, project._id);

      const feedResponse = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        owner.token,
      );

      expect(feedResponse.status).toBe(200);

      const activity = feedResponse.body.data.activities[0];

      const response = await RequestHelper.get(
        `${activityEndpoint}/activities/${activity._id}`,
        member.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject unrelated user from viewing an activity", async () => {
      const { owner, project } = await createOwnerProject();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      await createActivity(owner.token, project._id);

      const feedResponse = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        owner.token,
      );

      expect(feedResponse.status).toBe(200);

      const activity = feedResponse.body.data.activities[0];

      const response = await RequestHelper.get(
        `${activityEndpoint}/activities/${activity._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project } = await createOwnerProject();

      await createActivity(owner.token, project._id);

      const feedResponse = await RequestHelper.get(
        `${activityEndpoint}/projects/${project._id}/activity`,
        owner.token,
      );

      expect(feedResponse.status).toBe(200);

      const activity = feedResponse.body.data.activities[0];

      const response = await RequestHelper.get(
        `${activityEndpoint}/activities/${activity._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existing activity", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const fakeActivityId = "507f1f77bcf86cd799439011";

      const response = await RequestHelper.get(
        `${activityEndpoint}/activities/${fakeActivityId}`,
        user.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

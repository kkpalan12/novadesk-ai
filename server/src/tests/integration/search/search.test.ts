import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Search API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";
  const searchEndpoint = "/api/v1/search";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Search Workspace ${Date.now()}-${Math.random()}`,
        description: "Search integration workspace",
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
        name: `Search Project ${Date.now()}-${Math.random()}`,
        description: "Search integration project",
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
        title: `Search Task ${Date.now()}-${Math.random()}`,
        description: "Search integration task",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  describe("GET /api/v1/search", () => {
    it("should allow authenticated user to search", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=test`,
        user.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data.query).toBe("test");
      expect(response.body.data.workspaces).toBeDefined();
      expect(response.body.data.projects).toBeDefined();
      expect(response.body.data.tasks).toBeDefined();
      expect(response.body.data.comments).toBeDefined();
    });

    it("should find matching workspace", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(user.token);

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=Search Workspace`,
        user.token,
      );

      expect(response.status).toBe(200);

      expect(response.body.data.workspaces.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: workspace._id,
          }),
        ]),
      );
    });

    it("should find matching project", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(user.token);

      const project = await createProject(user.token, workspace._id);

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=Search Project`,
        user.token,
      );

      expect(response.status).toBe(200);

      expect(response.body.data.projects.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: project._id,
          }),
        ]),
      );
    });

    it("should find matching task", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(user.token);

      const project = await createProject(user.token, workspace._id);

      const task = await createTask(user.token, project._id);

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=Search Task`,
        user.token,
      );

      expect(response.status).toBe(200);

      expect(response.body.data.tasks.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: task._id,
          }),
        ]),
      );
    });

    it("should allow active workspace member to search workspace data", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const member = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const membershipResponse = await RequestHelper.post(
        "/api/v1/memberships",
        {
          workspace: workspace._id,
          user: member.user._id,
          role: "MEMBER",
        },
        owner.token,
      );

      expect(membershipResponse.status).toBe(201);

      const project = await createProject(owner.token, workspace._id);

      const task = await createTask(owner.token, project._id);

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=Search Task`,
        member.token,
      );

      expect(response.status).toBe(200);

      expect(response.body.data.tasks.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: task._id,
          }),
        ]),
      );
    });

    it("should not expose another workspace data", async () => {
      const owner1 = await AuthHelper.createAuthenticatedUser();

      const owner2 = await AuthHelper.createAuthenticatedUser();

      const workspace1 = await createWorkspace(owner1.token);

      const workspace2 = await createWorkspace(owner2.token);

      await createProject(owner1.token, workspace1._id);

      await createProject(owner2.token, workspace2._id);

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=Search Project`,
        owner1.token,
      );

      expect(response.status).toBe(200);

      const projects = response.body.data.projects.items;

      expect(
        projects.every(
          (project: any) =>
            project.workspace?._id?.toString() === workspace1._id.toString(),
        ),
      ).toBe(true);
    });

    it("should reject empty search query", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        `${searchEndpoint}?q=`,
        user.token,
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject missing search query", async () => {
      const user = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(searchEndpoint, user.token);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const response = await RequestHelper.get(`${searchEndpoint}?q=test`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

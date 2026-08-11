import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Project API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: "Project Test Workspace",
        description: "Workspace for project tests",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createProject(
    token: string,
    workspaceId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const response = await RequestHelper.post(
      projectEndpoint,
      {
        workspace: workspaceId,
        name: "Test Project",
        description: "Project integration test",
        ...overrides,
      },
      token,
    );

    return response;
  }

  describe("POST /api/v1/projects", () => {
    it("should allow workspace owner to create a project", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await createProject(owner.token, workspace._id);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.name).toBe("Test Project");
    });

    it("should reject unrelated user from creating a project", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await createProject(unrelated.token, workspace._id);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const response = await createProject("", workspace._id);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/projects", () => {
    it("should allow workspace owner to view projects", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const project = await createProject(owner.token, workspace._id);

      expect(project.status).toBe(201);

      const response = await RequestHelper.get(
        `${projectEndpoint}?workspace=${workspace._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.projects).toBeDefined();
    });

    it("should not return projects from another workspace", async () => {
      const owner1 = await AuthHelper.createAuthenticatedUser();

      const owner2 = await AuthHelper.createAuthenticatedUser();

      const workspace1 = await createWorkspace(owner1.token);

      const workspace2 = await createWorkspace(owner2.token);

      await createProject(owner1.token, workspace1._id);

      await createProject(owner2.token, workspace2._id);

      const response = await RequestHelper.get(
        `${projectEndpoint}?workspace=${workspace1._id}`,
        owner2.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.projects).toHaveLength(0);
    });

    it("should reject unauthenticated request", async () => {
      const response = await RequestHelper.get(projectEndpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/projects/:id", () => {
    it("should allow owner to get project by id", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const projectResponse = await createProject(owner.token, workspace._id);

      expect(projectResponse.status).toBe(201);

      const project = projectResponse.body.data;

      const response = await RequestHelper.get(
        `${projectEndpoint}/${project._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(project._id);
    });

    it("should reject unrelated user", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const projectResponse = await createProject(owner.token, workspace._id);

      expect(projectResponse.status).toBe(201);

      const project = projectResponse.body.data;

      const response = await RequestHelper.get(
        `${projectEndpoint}/${project._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/projects/:id", () => {
    it("should allow workspace owner to update project", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const projectResponse = await createProject(owner.token, workspace._id);

      expect(projectResponse.status).toBe(201);

      const project = projectResponse.body.data;

      const response = await RequestHelper.put(
        `${projectEndpoint}/${project._id}`,
        {
          name: "Updated Project",
          description: "Updated description",
        },
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Project");
    });

    it("should reject unrelated user from updating project", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const projectResponse = await createProject(owner.token, workspace._id);

      const project = projectResponse.body.data;

      const response = await RequestHelper.put(
        `${projectEndpoint}/${project._id}`,
        {
          name: "Unauthorized Update",
        },
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/projects/:id", () => {
    it("should allow workspace owner to delete project", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const projectResponse = await createProject(owner.token, workspace._id);

      expect(projectResponse.status).toBe(201);

      const project = projectResponse.body.data;

      const response = await RequestHelper.delete(
        `${projectEndpoint}/${project._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const getResponse = await RequestHelper.get(
        `${projectEndpoint}/${project._id}`,
        owner.token,
      );

      expect(getResponse.status).toBe(404);
    });

    it("should reject unrelated user from deleting project", async () => {
      const owner = await AuthHelper.createAuthenticatedUser();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const workspace = await createWorkspace(owner.token);

      const projectResponse = await createProject(owner.token, workspace._id);

      const project = projectResponse.body.data;

      const response = await RequestHelper.delete(
        `${projectEndpoint}/${project._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

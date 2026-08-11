import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Comment API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";
  const commentEndpoint = "/api/v1/comments";

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Comment Test Workspace ${Date.now()}`,
        description: "Workspace for comment tests",
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
        name: `Comment Test Project ${Date.now()}`,
        description: "Project for comment tests",
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
        title: `Comment Test Task ${Date.now()}`,
        description: "Task for comment tests",
        priority: "MEDIUM",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createOwnerTask() {
    const owner = await AuthHelper.createAuthenticatedUser();

    const workspace = await createWorkspace(owner.token);

    const project = await createProject(owner.token, workspace._id);

    const task = await createTask(owner.token, project._id);

    return {
      owner,
      workspace,
      project,
      task,
    };
  }

  async function createComment(
    token: string,
    taskId: string,
    content = "Test comment",
  ) {
    return RequestHelper.post(
      `/api/v1/tasks/${taskId}/comments`,
      {
        content,
      },
      token,
    );
  }

  describe("POST /api/v1/tasks/:taskId/comments", () => {
    it("should allow workspace owner to create a comment", async () => {
      const { owner, task } = await createOwnerTask();

      const response = await createComment(owner.token, task._id);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data._id).toBeDefined();

      expect(response.body.data.content).toBe("Test comment");
    });

    it("should reject unrelated user from creating a comment", async () => {
      const { owner, task } = await createOwnerTask();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await createComment(unrelated.token, task._id);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, task } = await createOwnerTask();

      const response = await createComment("", task._id);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/tasks/:taskId/comments", () => {
    it("should allow workspace owner to view comments", async () => {
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(owner.token, task._id);

      expect(commentResponse.status).toBe(201);

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      expect(response.body.data).toHaveLength(1);

      expect(response.body.data[0].content).toBe("Test comment");
    });

    it("should reject unrelated user", async () => {
      const { owner, task } = await createOwnerTask();

      await createComment(owner.token, task._id);

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, task } = await createOwnerTask();

      const response = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/comments/:id", () => {
    it("should allow comment owner to update a comment", async () => {
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(
        owner.token,
        task._id,
        "Original comment",
      );

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const response = await RequestHelper.put(
        `${commentEndpoint}/${comment._id}`,
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
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(owner.token, task._id);

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.put(
        `${commentEndpoint}/${comment._id}`,
        {
          content: "Unauthorized update",
        },
        unrelated.token,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(owner.token, task._id);

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const response = await RequestHelper.put(
        `${commentEndpoint}/${comment._id}`,
        {
          content: "Unauthorized update",
        },
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/comments/:id", () => {
    it("should allow comment owner to delete a comment", async () => {
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(owner.token, task._id);

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const response = await RequestHelper.delete(
        `${commentEndpoint}/${comment._id}`,
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const getResponse = await RequestHelper.get(
        `/api/v1/tasks/${task._id}/comments`,
        owner.token,
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toHaveLength(0);
    });

    it("should reject another user from deleting a comment", async () => {
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(owner.token, task._id);

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.delete(
        `${commentEndpoint}/${comment._id}`,
        unrelated.token,
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated request", async () => {
      const { owner, task } = await createOwnerTask();

      const commentResponse = await createComment(owner.token, task._id);

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      const response = await RequestHelper.delete(
        `${commentEndpoint}/${comment._id}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Tenant isolation", () => {
    it("should reject access to comments from another workspace", async () => {
      const { owner: owner1, task: task1 } = await createOwnerTask();

      const { owner: owner2, task: task2 } = await createOwnerTask();

      const commentResponse = await createComment(owner1.token, task1._id);

      expect(commentResponse.status).toBe(201);

      const comment = commentResponse.body.data;

      /**
       * Owner 2 tries to access
       * Owner 1's task comments.
       */
      const getResponse = await RequestHelper.get(
        `/api/v1/tasks/${task1._id}/comments`,
        owner2.token,
      );

      expect(getResponse.status).toBe(404);
      expect(getResponse.body.success).toBe(false);

      /**
       * Owner 2 tries to update
       * Owner 1's comment.
       */
      const updateResponse = await RequestHelper.put(
        `${commentEndpoint}/${comment._id}`,
        {
          content: "Cross workspace update",
        },
        owner2.token,
      );

      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.success).toBe(false);

      /**
       * Owner 2 tries to delete
       * Owner 1's comment.
       */
      const deleteResponse = await RequestHelper.delete(
        `${commentEndpoint}/${comment._id}`,
        owner2.token,
      );

      expect(deleteResponse.status).toBe(403);
      expect(deleteResponse.body.success).toBe(false);

      /**
       * Keep task2 referenced so the fixture
       * is intentionally created as another
       * isolated workspace.
       */
      expect(task2._id).toBeDefined();
    });
  });
});

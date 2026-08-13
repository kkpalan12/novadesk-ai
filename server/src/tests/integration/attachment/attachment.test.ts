import request from "supertest";
import fs from "fs";
import path from "path";

import app from "../../../app";

import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Attachment API", () => {
  const workspaceEndpoint = "/api/v1/workspaces";
  const projectEndpoint = "/api/v1/projects";

  const uploadEndpoint = (taskId: string) =>
    `/api/v1/tasks/${taskId}/attachments`;

  const attachmentEndpoint = (id: string) => `/api/v1/attachments/${id}`;

  const fixturePath = path.join(__dirname, "attachment-test.png");

  const invalidFixturePath = path.join(__dirname, "attachment-test.txt");

  // =========================================================
  // FIXTURES
  // =========================================================

  beforeAll(() => {
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );

    fs.writeFileSync(fixturePath, pngBuffer);

    fs.writeFileSync(invalidFixturePath, "This is an invalid attachment file.");
  });

  afterAll(() => {
    if (fs.existsSync(fixturePath)) {
      fs.unlinkSync(fixturePath);
    }

    if (fs.existsSync(invalidFixturePath)) {
      fs.unlinkSync(invalidFixturePath);
    }
  });

  // =========================================================
  // HELPERS
  // =========================================================

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      workspaceEndpoint,
      {
        name: `Attachment Workspace ${Date.now()}-${Math.random()}`,
        description: "Attachment integration test workspace",
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
        name: `Attachment Project ${Date.now()}-${Math.random()}`,
        description: "Attachment integration test project",
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
        title: `Attachment Task ${Date.now()}-${Math.random()}`,
        description: "Attachment integration test task",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createTestData() {
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

  async function createMember(
    ownerToken: string,
    workspaceId: string,
    userId: string,
  ) {
    const response = await RequestHelper.post(
      "/api/v1/memberships",
      {
        workspace: workspaceId,
        user: userId,
      },
      ownerToken,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function uploadAttachment(token: string, taskId: string) {
    return request(app)
      .post(uploadEndpoint(taskId))
      .set("Authorization", `Bearer ${token}`)
      .attach("file", fixturePath);
  }

  // =========================================================
  // POST
  // =========================================================

  describe("POST /api/v1/tasks/:taskId/attachments", () => {
    it("should allow workspace owner to upload attachment", async () => {
      const { owner, task } = await createTestData();

      const response = await uploadAttachment(owner.token, task._id);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toBeDefined();

      expect(response.body.data._id).toBeDefined();

      expect(response.body.data.task).toBe(task._id);

      expect(response.body.data.uploadedBy).toBe(owner.user._id);

      expect(response.body.data.originalName).toBe("attachment-test.png");

      expect(response.body.data.mimeType).toBe("image/png");

      expect(response.body.data.size).toBeGreaterThan(0);

      expect(response.body.data.fileName).toBeDefined();

      expect(response.body.data.path).toBeDefined();

      expect(response.body.data.url).toBeDefined();
    });

    it("should allow active workspace member to upload attachment", async () => {
      const { owner, workspace, task } = await createTestData();

      const member = await AuthHelper.createAuthenticatedUser();

      await createMember(owner.token, workspace._id, member.user._id);

      const response = await uploadAttachment(member.token, task._id);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.uploadedBy).toBe(member.user._id);
    });

    it("should reject unrelated user from uploading attachment", async () => {
      const { task } = await createTestData();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await uploadAttachment(unrelated.token, task._id);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject unauthenticated upload", async () => {
      const { task } = await createTestData();

      const response = await RequestHelper.post(uploadEndpoint(task._id));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject upload without file", async () => {
      const { owner, task } = await createTestData();

      const response = await request(app)
        .post(uploadEndpoint(task._id))
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject unsupported file type", async () => {
      const { owner, task } = await createTestData();

      const response = await request(app)
        .post(uploadEndpoint(task._id))
        .set("Authorization", `Bearer ${owner.token}`)
        .attach("file", invalidFixturePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject upload for non-existing task", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const fakeTaskId = "507f1f77bcf86cd799439011";

      const response = await uploadAttachment(token, fakeTaskId);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // =========================================================
  // GET
  // =========================================================

  describe("GET /api/v1/tasks/:taskId/attachments", () => {
    it("should allow workspace owner to view attachments", async () => {
      const { owner, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const response = await RequestHelper.get(
        uploadEndpoint(task._id),
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(1);

      expect(response.body.data[0]._id).toBe(uploadResponse.body.data._id);
    });

    it("should allow active workspace member to view attachments", async () => {
      const { owner, workspace, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const member = await AuthHelper.createAuthenticatedUser();

      await createMember(owner.token, workspace._id, member.user._id);

      const response = await RequestHelper.get(
        uploadEndpoint(task._id),
        member.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(1);
    });

    it("should reject unrelated user from viewing attachments", async () => {
      const { owner, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.get(
        uploadEndpoint(task._id),
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return empty array when task has no attachments", async () => {
      const { owner, task } = await createTestData();

      const response = await RequestHelper.get(
        uploadEndpoint(task._id),
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toEqual([]);
    });

    it("should reject unauthenticated request", async () => {
      const { task } = await createTestData();

      const response = await RequestHelper.get(uploadEndpoint(task._id));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existing task", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const fakeTaskId = "507f1f77bcf86cd799439011";

      const response = await RequestHelper.get(
        uploadEndpoint(fakeTaskId),
        token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // =========================================================
  // DELETE
  // =========================================================

  describe("DELETE /api/v1/attachments/:id", () => {
    it("should allow workspace owner to delete attachment", async () => {
      const { owner, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const attachment = uploadResponse.body.data;

      const response = await RequestHelper.delete(
        attachmentEndpoint(attachment._id),
        owner.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const getResponse = await RequestHelper.get(
        uploadEndpoint(task._id),
        owner.token,
      );

      expect(getResponse.status).toBe(200);

      expect(getResponse.body.data).toHaveLength(0);
    });

    it("should allow active workspace member to delete attachment", async () => {
      const { owner, workspace, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const attachment = uploadResponse.body.data;

      const member = await AuthHelper.createAuthenticatedUser();

      await createMember(owner.token, workspace._id, member.user._id);

      const response = await RequestHelper.delete(
        attachmentEndpoint(attachment._id),
        member.token,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject unrelated user from deleting attachment", async () => {
      const { owner, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const attachment = uploadResponse.body.data;

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.delete(
        attachmentEndpoint(attachment._id),
        unrelated.token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      const getResponse = await RequestHelper.get(
        uploadEndpoint(task._id),
        owner.token,
      );

      expect(getResponse.status).toBe(200);

      expect(getResponse.body.data).toHaveLength(1);
    });

    it("should return 404 when deleting already deleted attachment", async () => {
      const { owner, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const attachment = uploadResponse.body.data;

      const firstDelete = await RequestHelper.delete(
        attachmentEndpoint(attachment._id),
        owner.token,
      );

      expect(firstDelete.status).toBe(200);

      const secondDelete = await RequestHelper.delete(
        attachmentEndpoint(attachment._id),
        owner.token,
      );

      expect(secondDelete.status).toBe(404);
      expect(secondDelete.body.success).toBe(false);
    });

    it("should reject unauthenticated delete", async () => {
      const { owner, task } = await createTestData();

      const uploadResponse = await uploadAttachment(owner.token, task._id);

      expect(uploadResponse.status).toBe(201);

      const attachment = uploadResponse.body.data;

      const response = await RequestHelper.delete(
        attachmentEndpoint(attachment._id),
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existing attachment", async () => {
      const { token } = await AuthHelper.createAuthenticatedUser();

      const fakeAttachmentId = "507f1f77bcf86cd799439011";

      const response = await RequestHelper.delete(
        attachmentEndpoint(fakeAttachmentId),
        token,
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
    it("should reject file larger than 5 MB", async () => {
      const { owner, task } = await createTestData();

      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(app)
        .post(uploadEndpoint(task._id))
        .set("Authorization", `Bearer ${owner.token}`)
        .attach("file", largeBuffer, {
          filename: "large-test.png",
          contentType: "image/png",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("File size cannot exceed 5 MB");
    });
  });
});

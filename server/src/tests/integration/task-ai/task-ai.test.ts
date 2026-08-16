jest.mock("../../../services/gemini.service", () => {
  const mockGenerateTaskAnalysis = jest.fn();

  class MockGeminiService {
    generateTaskAnalysis = mockGenerateTaskAnalysis;
  }

  return {
    __esModule: true,
    GeminiService: MockGeminiService,
    __mockGenerateTaskAnalysis: mockGenerateTaskAnalysis,
  };
});

import { AuthHelper } from "../../helpers/auth";
import { RequestHelper } from "../../helpers/request";

describe("Task AI API", () => {
  const taskEndpoint = "/api/v1/projects";

  function getMockGenerateTaskAnalysis(): jest.Mock {
    const geminiMock = jest.requireMock("../../../services/gemini.service") as {
      __mockGenerateTaskAnalysis: jest.Mock;
    };

    return geminiMock.__mockGenerateTaskAnalysis;
  }

  async function createWorkspace(token: string) {
    const response = await RequestHelper.post(
      "/api/v1/workspaces",
      {
        name: `AI Test Workspace ${Date.now()}`,
        description: "Workspace for AI tests",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createProject(token: string, workspaceId: string) {
    const response = await RequestHelper.post(
      "/api/v1/projects",
      {
        workspace: workspaceId,
        name: `AI Test Project ${Date.now()}`,
        description: "Project for AI tests",
      },
      token,
    );

    expect(response.status).toBe(201);

    return response.body.data;
  }

  async function createTask(token: string, projectId: string) {
    const response = await RequestHelper.post(
      `${taskEndpoint}/${projectId}/tasks`,
      {
        title: "Implement AI Task Copilot",
        description:
          "Build an AI assistant that analyzes tasks and suggests practical next steps.",
        priority: "MEDIUM",
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

  async function createAuthorizedTask() {
    const { owner, project } = await createOwnerProject();

    const task = await createTask(owner.token, project._id);

    return {
      owner,
      project,
      task,
    };
  }

  beforeEach(() => {
    getMockGenerateTaskAnalysis().mockReset();
  });

  describe("POST /api/v1/projects/:projectId/tasks/:id/ai/analyze", () => {
    it("should analyze an authorized task successfully", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      getMockGenerateTaskAnalysis().mockResolvedValue({
        text: JSON.stringify({
          summary: "The task is to build an AI-powered task analysis feature.",

          suggestedPriority: "HIGH",

          suggestedSubtasks: [
            "Define the AI response schema",
            "Implement the backend AI service",
            "Add the frontend AI panel",
          ],

          risks: [
            "AI responses may require validation",
            "AI API failures must be handled safely",
          ],

          nextAction: "Implement and test the backend AI service.",
        }),
      });

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe("Task analyzed successfully");

      expect(response.body.data).toEqual({
        summary: "The task is to build an AI-powered task analysis feature.",

        suggestedPriority: "HIGH",

        suggestedSubtasks: [
          "Define the AI response schema",
          "Implement the backend AI service",
          "Add the frontend AI panel",
        ],

        risks: [
          "AI responses may require validation",
          "AI API failures must be handled safely",
        ],

        nextAction: "Implement and test the backend AI service.",
      });

      expect(getMockGenerateTaskAnalysis()).toHaveBeenCalledTimes(1);
    });

    it("should reject unrelated user", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const unrelated = await AuthHelper.createAuthenticatedUser();

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        unrelated.token,
      );

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);

      expect(getMockGenerateTaskAnalysis()).not.toHaveBeenCalled();
    });

    it("should reject unauthenticated request", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
      );

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);

      expect(getMockGenerateTaskAnalysis()).not.toHaveBeenCalled();
    });

    it("should reject task from another project", async () => {
      const { owner: owner1, project: project1 } = await createOwnerProject();

      const { owner: owner2, project: project2 } = await createOwnerProject();

      const task = await createTask(owner1.token, project1._id);

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project2._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner2.token,
      );

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);

      expect(getMockGenerateTaskAnalysis()).not.toHaveBeenCalled();
    });

    it("should return 401 when Gemini authentication fails", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const error = Object.assign(new Error("Gemini authentication failed"), {
        status: 401,
      });

      getMockGenerateTaskAnalysis().mockRejectedValue(error);

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "AI provider authentication failed",
      });

      expect(getMockGenerateTaskAnalysis()).toHaveBeenCalledTimes(1);
    });

    it("should return 403 when Gemini access is forbidden", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const error = Object.assign(new Error("Gemini access forbidden"), {
        status: 403,
      });

      getMockGenerateTaskAnalysis().mockRejectedValue(error);

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(403);

      expect(response.body).toEqual({
        success: false,
        message: "AI provider access is not available",
      });
    });

    it("should return 503 when Gemini model is unavailable", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const error = Object.assign(new Error("Gemini model not found"), {
        status: 404,
      });

      getMockGenerateTaskAnalysis().mockRejectedValue(error);

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "AI model is currently unavailable",
      });
    });

    it("should return 429 when Gemini rate limit is reached", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const error = Object.assign(new Error("Gemini rate limit"), {
        status: 429,
      });

      getMockGenerateTaskAnalysis().mockRejectedValue(error);

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(429);

      expect(response.body).toEqual({
        success: false,
        message: "Too many AI requests. Please try again later.",
      });
    });

    it("should return 503 for Gemini server errors", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      const error = Object.assign(new Error("Gemini service unavailable"), {
        status: 503,
      });

      getMockGenerateTaskAnalysis().mockRejectedValue(error);

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message:
          "AI service is temporarily unavailable. Please try again later.",
      });
    });

    it("should return 503 for unexpected Gemini errors", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      getMockGenerateTaskAnalysis().mockRejectedValue(
        new Error("Unexpected Gemini failure"),
      );

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(503);

      expect(response.body).toEqual({
        success: false,
        message: "AI analysis is currently unavailable",
      });
    });

    it("should reject an empty Gemini response", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      getMockGenerateTaskAnalysis().mockResolvedValue({
        text: "",
      });

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "AI analysis did not return a valid response",
      });
    });

    it("should reject invalid Gemini JSON", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      getMockGenerateTaskAnalysis().mockResolvedValue({
        text: "not valid json",
      });

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "AI analysis response could not be parsed",
      });
    });

    it("should reject invalid Gemini response schema", async () => {
      const { owner, project, task } = await createAuthorizedTask();

      getMockGenerateTaskAnalysis().mockResolvedValue({
        text: JSON.stringify({
          summary: "Invalid response",
          suggestedPriority: "INVALID",
          suggestedSubtasks: [],
          risks: [],
          nextAction: "Do something",
        }),
      });

      const response = await RequestHelper.post(
        `${taskEndpoint}/${project._id}/tasks/${task._id}/ai/analyze`,
        undefined,
        owner.token,
      );

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        success: false,
        message: "AI analysis returned an invalid response",
      });
    });
  });
});

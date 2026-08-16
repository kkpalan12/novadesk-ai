import { z } from "zod";

import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";

import { GeminiService } from "./gemini.service";

import { BadRequestError } from "../common/errors/BadRequestError";
import { NotFoundError } from "../common/errors/NotFoundError";
import { UnauthorizedError } from "../common/errors/UnauthorizedError";
import { ForbiddenError } from "../common/errors/ForbiddenError";
import { ServiceUnavailableError } from "../common/errors/ServiceUnavailableError";
import { TooManyRequestsError } from "../common/errors/TooManyRequestsError";

const taskAiAnalysisSchema = z.object({
  summary: z.string(),

  suggestedPriority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),

  suggestedSubtasks: z.array(z.string()),

  risks: z.array(z.string()),

  nextAction: z.string(),
});

export type TaskAiAnalysis = z.infer<typeof taskAiAnalysisSchema>;

export class TaskAiService {
  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly membershipRepository = new MembershipRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly geminiService = new GeminiService();

  async analyzeTask(
    taskId: string,
    projectId: string,
    userId: string,
  ): Promise<TaskAiAnalysis> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceId = this.getWorkspaceId(project);

    await this.verifyProjectAccess(workspaceId, userId);

    const task = await this.taskRepository.findById(taskId, projectId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const prompt = `
You are NovaDesk AI Task Copilot.

Analyze the following project management task.

Task title:
${task.title}

Task description:
${task.description ?? ""}

Current status:
${task.status}

Current priority:
${task.priority}

Provide practical recommendations for completing this task.

Rules:
- Do not invent facts that are not present in the task.
- Keep the summary concise.
- Suggested subtasks should be actionable.
- Risks should be realistic and relevant to the task.
- Provide exactly one clear next action.
- Suggested priority must be one of:
  LOW, MEDIUM, HIGH, CRITICAL.
`;

    let response;

    try {
      response = await this.geminiService.generateTaskAnalysis(prompt);
    } catch (error: unknown) {
      console.error("Gemini API Error:", error);

      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status?: unknown }).status === "number"
          ? (error as { status: number }).status
          : undefined;

      switch (status) {
        case 401:
          throw new UnauthorizedError("AI provider authentication failed");

        case 403:
          throw new ForbiddenError("AI provider access is not available");

        case 404:
          throw new ServiceUnavailableError(
            "AI model is currently unavailable",
          );

        case 429:
          throw new TooManyRequestsError(
            "Too many AI requests. Please try again later.",
          );

        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServiceUnavailableError(
            "AI service is temporarily unavailable. Please try again later.",
          );

        default:
          throw new ServiceUnavailableError(
            "AI analysis is currently unavailable",
          );
      }
    }

    const responseText = response.text;

    if (!responseText) {
      throw new BadRequestError("AI analysis did not return a valid response");
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error: unknown) {
      console.error("Gemini response parsing error:", error);

      throw new BadRequestError("AI analysis response could not be parsed");
    }

    const validationResult = taskAiAnalysisSchema.safeParse(parsedResponse);

    if (!validationResult.success) {
      console.error(
        "Gemini response validation error:",
        validationResult.error,
      );

      throw new BadRequestError("AI analysis returned an invalid response");
    }

    return validationResult.data;
  }

  private async verifyProjectAccess(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (isOwner) {
      return;
    }

    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (!membership || membership.status !== "ACTIVE") {
      throw new NotFoundError("Project not found");
    }
  }

  private getWorkspaceId(project: { workspace?: unknown }): string {
    if (!project?.workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const workspace = project.workspace;

    if (
      typeof workspace === "object" &&
      workspace !== null &&
      "_id" in workspace
    ) {
      return String((workspace as { _id: unknown })._id);
    }

    return String(workspace);
  }
}

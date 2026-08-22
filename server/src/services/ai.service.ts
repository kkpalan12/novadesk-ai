import { ProjectRepository } from "../repositories/project.repository";
import { TaskRepository } from "../repositories/task.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";

import { NotFoundError } from "../common/errors/NotFoundError";

import { GeminiService } from "./gemini.service";

export interface AiProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  highPriorityTasks: number;
  criticalTasks: number;
  unassignedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
}

export interface AiAssistantResponse {
  message: string;

  metrics?: AiProjectMetrics;

  project?: {
    id: string;
    name: string;
  };

  focusTasks?: FocusTaskContext[];
}

interface ProjectTaskContext {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: Date;
  assignedTo?: {
    firstName?: string;
    lastName?: string;
  };
}

interface FocusTaskContext {
  id: string;
  title: string;
  priority: string;
  status: string;
  reason: string;
}

interface ProjectContext {
  id: string;
  name: string;
  description: string;
  status?: string;
  tasks: ProjectTaskContext[];
  metrics: AiProjectMetrics;
  focusTasks: FocusTaskContext[];
}

export class AiService {
  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly taskRepository = new TaskRepository();

  private readonly geminiService = new GeminiService();

  async chat(
    message: string,
    workspaceId: string,
    userId: string,
    projectId?: string,
  ): Promise<AiAssistantResponse> {
    // ==========================================================
    // VERIFY WORKSPACE ACCESS
    // ==========================================================

    const workspace = await this.workspaceRepository.findById(
      workspaceId,
      userId,
    );

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    console.log("NovaDesk AI Service Context:", {
      workspaceId,
      projectId,
      userId,
    });

    // ==========================================================
    // ACCESSIBLE WORKSPACES
    // ==========================================================

    const accessibleWorkspaceIds =
      await this.workspaceRepository.findAccessibleWorkspaceIds(userId);

    // ==========================================================
    // SELECTED PROJECT
    // ==========================================================

    let selectedProject: ProjectContext | null = null;

    if (projectId) {
      selectedProject = await this.buildProjectContext(
        projectId,
        workspaceId,
        accessibleWorkspaceIds,
      );
    }

    // ==========================================================
    // WORKSPACE PROJECTS
    // ==========================================================

    const projectResult = await this.projectRepository.findAll({
      page: 1,
      limit: 100,
      workspaceIds: accessibleWorkspaceIds,
      workspace: workspaceId,
    });

    // ==========================================================
    // PROJECT CONTEXT
    // ==========================================================

    const projectContexts = await Promise.all(
      projectResult.projects.map(async (project) => {
        if (projectId && String(project._id) === projectId && selectedProject) {
          return selectedProject;
        }

        return this.buildProjectContext(
          String(project._id),
          workspaceId,
          accessibleWorkspaceIds,
        );
      }),
    );

    // ==========================================================
    // WORKSPACE CONTEXT
    // ==========================================================

    const workspaceContext = {
      name: workspace.name,

      projects: projectContexts.map((project) => ({
        name: project.name,
        description: project.description,
        status: project.status,
        tasks: project.tasks,
        metrics: project.metrics,
      })),
    };

    // ==========================================================
    // SELECTED PROJECT CONTEXT
    // ==========================================================

    const selectedProjectContext = selectedProject
      ? {
          name: selectedProject.name,

          description: selectedProject.description,

          status: selectedProject.status,

          metrics: selectedProject.metrics,

          tasks: selectedProject.tasks,

          focusTasks: selectedProject.focusTasks.map((task) => ({
            title: task.title,
            priority: task.priority,
            status: task.status,
            reason: task.reason,
          })),
        }
      : null;

    // ==========================================================
    // AI PROMPT
    // ==========================================================

    const prompt = `
You are NovaDesk AI, an intelligent project
management assistant inside an enterprise
workspace platform.

WORKSPACE CONTEXT:

${JSON.stringify(workspaceContext, null, 2)}

CURRENT PROJECT:

${
  selectedProjectContext
    ? JSON.stringify(selectedProjectContext, null, 2)
    : "No specific project is currently selected."
}

USER REQUEST:

${message}
==================================================
PROJECT HEALTH BEHAVIOR
==================================================

If the user asks for a project health report,
project health, project risks, or asks whether
the project is healthy:

- Use CURRENT PROJECT only.
- Use the actual project metrics and tasks.
- Never judge project health from task count alone.

Return:

## Project Health

**Project:** <project name>

**Overall Assessment:** Healthy / Needs Attention /
At Risk

### Evidence

Mention the actual evidence supporting the
assessment:

- Completed vs incomplete tasks
- Critical priority tasks
- High priority tasks
- Unassigned tasks
- Overdue tasks
- Due-soon tasks
- Current task status distribution

### Key Risks

List only risks directly supported by the
available data.

### Recommended Attention

Give 1–3 practical areas that deserve attention.

Rules:

- A large number of tasks alone does NOT mean
  the project is unhealthy.
- Critical or high-priority incomplete work may
  indicate attention is required.
- Unassigned high/critical tasks may indicate
  an ownership risk.
- Overdue tasks are important evidence when
  actual dueDate information exists.
- Do not claim something is overdue without an
  actual dueDate.
- Do not invent deadlines.
- Do not invent project status.
- If there is insufficient evidence, say:
  "There is not enough available data to
  determine project health confidently."

==================================================


==================================================
PROJECT BRIEF BEHAVIOR
==================================================

If the user asks for a project brief, project
summary, or says "Give me a project brief":

- Use CURRENT PROJECT only.
- Do not summarize the entire workspace.
- Use only the project information and task
  information provided in CURRENT PROJECT.

Return a concise Markdown response containing:

## Project Brief

**Project:** <project name>

**Purpose:** Briefly describe the project using
only the available project description.

**Status:** Use the actual project status if
available.

### Progress

- Total tasks
- Completed tasks
- In-progress tasks
- To-do tasks
- Review tasks

### Priority

- Critical tasks
- High priority tasks

### Attention Areas

Mention only observable concerns such as:

- High number of incomplete tasks
- Critical tasks
- Unassigned tasks
- Overdue tasks
- Tasks due soon

Do not invent risks.

### Summary

Give a short overall assessment based only on
the supplied data.

If information is unavailable, explicitly say
that it is not currently available.

==================================================
==================================================
PROJECT HEALTH BEHAVIOR
==================================================

If the user asks for a project health report,
project health, project risks, or asks whether
the project is healthy:

- Use CURRENT PROJECT only.
- Use the actual project metrics and tasks.
- Never judge project health from task count alone.

Return:

## Project Health

**Project:** <project name>

**Overall Assessment:** Healthy / Needs Attention /
At Risk

### Evidence

Mention the actual evidence supporting the
assessment:

- Completed vs incomplete tasks
- Critical priority tasks
- High priority tasks
- Unassigned tasks
- Overdue tasks
- Due-soon tasks
- Current task status distribution

### Key Risks

List only risks directly supported by the
available data.

### Recommended Attention

Give 1–3 practical areas that deserve attention.

Rules:

- A large number of tasks alone does NOT mean
  the project is unhealthy.
- Critical or high-priority incomplete work may
  indicate attention is required.
- Unassigned high/critical tasks may indicate
  an ownership risk.
- Overdue tasks are important evidence when
  actual dueDate information exists.
- Do not claim something is overdue without an
  actual dueDate.
- Do not invent deadlines.
- Do not invent project status.
- If there is insufficient evidence, say:
  "There is not enough available data to
  determine project health confidently."

==================================================
==================================================
FOCUS NEXT BEHAVIOR
==================================================

If the user asks:

- "What should I focus on?"
- "What should I work on next?"
- "Which task should I work on?"
- "Focus Next"

then use CURRENT PROJECT only.

Use the supplied focusTasks list.

IMPORTANT:

- The list is generated from actual project tasks.
- The list is already ordered by priority and urgency.
- Recommend at most 3 tasks.
- Use the exact task titles supplied.
- Never invent task names.
- Never recommend a DONE task.
- Do not recommend a task that is not in the supplied focusTasks list.

Use this format:

## Focus Next

### 1. <exact task title>

**Priority:** <priority>  
**Status:** <status>

**Why:** <reason based only on the supplied task data>

### 2. <exact task title>

**Priority:** <priority>  
**Status:** <status>

**Why:** <reason based only on the supplied task data>

### 3. <exact task title>

**Priority:** <priority>  
**Status:** <status>

**Why:** <reason based only on the supplied task data>

If fewer than 3 tasks are available,
show only the available tasks.

If focusTasks is empty, respond:

"There are currently no clear priority tasks
to recommend for this project."

Do not invent urgency, deadlines,
business impact, or other information.

==================================================
==================================================
IMPORTANT RULES
==================================================

1. Use ONLY the workspace, project, and task
   information provided above.

2. Never invent projects, tasks, statuses,
   priorities, users, deadlines, progress,
   or other facts.

3. Never display MongoDB IDs, workspace IDs,
   project IDs, or task IDs unless the user
   explicitly asks for them.

4. If information is unavailable, clearly
   state that it is not currently available.

5. When the user says "this project", use
   CURRENT PROJECT.

6. When discussing project health, use actual
   metrics and task information.

7. When the user asks:
   "What should I focus on first?"

   prioritize tasks using this order:

   1. CRITICAL priority incomplete tasks
   2. HIGH priority incomplete tasks
   3. Overdue incomplete tasks
   4. Tasks due soon
   5. Unassigned high/critical tasks
   6. Remaining incomplete tasks

8. Never claim a task is overdue unless its
   actual dueDate is before the current date.

9. Never claim a task is due soon unless its
   actual dueDate is available.

10. Never invent a deadline.

11. DONE tasks are completed and should not be
    recommended as current work.

12. If multiple tasks have the same priority,
    use due date when available.

13. If there is not enough information to
    determine a clear priority, say so.

14. When recommending work, explain briefly
    WHY it should be prioritized.

15. Keep responses concise and professional.

16. Use Markdown.

17. Do not expose internal implementation
    details.

18. Task-specific deep analysis is handled by
    NovaDesk Task AI.


==================================================
EXAMPLES OF QUESTIONS YOU SHOULD HANDLE
==================================================

"Give me a health report for this project"

"What should I focus on first?"

"Which task should I work on next?"

"What are my highest priority tasks?"

"Show me unassigned high priority work."

"How many tasks are overdue?"

"Which tasks are due soon?"

"Give me a project brief."

"Summarize my workspace."

==================================================
`;

    // ==========================================================
    // GEMINI
    // ==========================================================

    const response = await this.geminiService.generateAssistantResponse(prompt);

    const responseText = response.text;

    if (!responseText) {
      throw new Error("AI assistant did not return a response");
    }

    // ==========================================================
    // RESPONSE
    // ==========================================================

    const result: AiAssistantResponse = {
      message: responseText.trim(),
    };

    if (selectedProject) {
      result.metrics = selectedProject.metrics;

      result.project = {
        id: selectedProject.id,
        name: selectedProject.name,
      };

      result.focusTasks = selectedProject.focusTasks;
    }

    return result;
  }

  // ============================================================
  // BUILD PROJECT CONTEXT
  // ============================================================

  private async buildProjectContext(
    projectId: string,
    workspaceId: string,
    accessibleWorkspaceIds: string[],
  ): Promise<ProjectContext> {
    const project = await this.projectRepository.findByIdWithWorkspaceAccess(
      projectId,
      accessibleWorkspaceIds,
    );

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const projectWorkspaceId = this.getProjectWorkspaceId(project);

    if (projectWorkspaceId !== workspaceId) {
      throw new NotFoundError("Project not found");
    }

    // ==========================================================
    // TASKS
    // ==========================================================

    const taskResult = await this.taskRepository.findAll({
      page: 1,
      limit: 100,
      project: projectId,
    });

    const tasks: ProjectTaskContext[] = taskResult.tasks.map((task) => ({
      id: String(task._id),

      title: task.title,

      description: task.description ?? "",

      status: task.status,

      priority: task.priority,

      dueDate: task.dueDate,

      assignedTo:
        task.assignedTo && typeof task.assignedTo === "object"
          ? {
              firstName: task.assignedTo.firstName,
              lastName: task.assignedTo.lastName,
            }
          : undefined,
    }));

    // ==========================================================
    // DATE CONTEXT
    // ==========================================================

    const now = new Date();

    const dueSoonDate = new Date(now);

    dueSoonDate.setDate(dueSoonDate.getDate() + 7);

    // ==========================================================
    // INCOMPLETE TASKS
    // ==========================================================

    const incompleteTasks = tasks.filter((task) => task.status !== "DONE");

    // ==========================================================
    // PRIORITY / URGENCY LISTS
    // ==========================================================

    const criticalTasksList = incompleteTasks.filter(
      (task) => task.priority === "CRITICAL",
    );

    const highPriorityTasksList = incompleteTasks.filter(
      (task) => task.priority === "HIGH",
    );

    const overdueTasksList = incompleteTasks.filter(
      (task) => !!task.dueDate && new Date(task.dueDate) < now,
    );

    const dueSoonTasksList = incompleteTasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }

      const dueDate = new Date(task.dueDate);

      return dueDate >= now && dueDate <= dueSoonDate;
    });

    const unassignedPriorityTasks = incompleteTasks.filter(
      (task) =>
        !task.assignedTo &&
        (task.priority === "HIGH" || task.priority === "CRITICAL"),
    );

    // ==========================================================
    // FOCUS TASKS
    // ==========================================================

    const focusTaskMap = new Map<string, FocusTaskContext>();

    const addFocusTask = (task: ProjectTaskContext, reason: string): void => {
      if (!focusTaskMap.has(task.id)) {
        focusTaskMap.set(task.id, {
          id: task.id,
          title: task.title,
          priority: task.priority,
          status: task.status,
          reason,
        });
      }
    };

    criticalTasksList.forEach((task) => {
      addFocusTask(task, "Critical priority incomplete task");
    });

    highPriorityTasksList.forEach((task) => {
      addFocusTask(task, "High priority incomplete task");
    });

    overdueTasksList.forEach((task) => {
      addFocusTask(task, "Overdue incomplete task");
    });

    dueSoonTasksList.forEach((task) => {
      addFocusTask(task, "Due within 7 days");
    });

    unassignedPriorityTasks.forEach((task) => {
      addFocusTask(task, "Unassigned high/critical priority task");
    });

    const focusTasks = Array.from(focusTaskMap.values()).slice(0, 5);
    // ==========================================================
    // METRICS
    // ==========================================================

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) => task.status === "DONE",
    ).length;

    const inProgressTasks = tasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;

    const todoTasks = tasks.filter((task) => task.status === "TODO").length;

    const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;

    const highPriorityTasks = tasks.filter(
      (task) => task.priority === "HIGH" || task.priority === "CRITICAL",
    ).length;

    const criticalTasks = tasks.filter(
      (task) => task.priority === "CRITICAL",
    ).length;

    const unassignedTasks = tasks.filter((task) => !task.assignedTo).length;

    const overdueTasks = overdueTasksList.length;

    const dueSoonTasks = dueSoonTasksList.length;

    const metrics: AiProjectMetrics = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      highPriorityTasks,
      criticalTasks,
      unassignedTasks,
      overdueTasks,
      dueSoonTasks,
    };

    // ==========================================================
    // RETURN
    // ==========================================================

    return {
      id: String(project._id),

      name: project.name,

      description: project.description ?? "",

      status: project.status ?? undefined,

      tasks,

      metrics,

      focusTasks,
    };
  }

  // ============================================================
  // PROJECT WORKSPACE
  // ============================================================

  private getProjectWorkspaceId(project: { workspace?: unknown }): string {
    if (!project.workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const workspace = project.workspace;

    if (
      typeof workspace === "object" &&
      workspace !== null &&
      "_id" in workspace
    ) {
      return String(
        (
          workspace as {
            _id: unknown;
          }
        )._id,
      );
    }

    return String(workspace);
  }
}

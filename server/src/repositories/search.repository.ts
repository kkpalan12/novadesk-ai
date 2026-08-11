import { Workspace } from "../models/workspace.model";
import { Membership } from "../models/membership.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import { Comment } from "../models/comment.model";

import { GlobalSearchResult } from "../interfaces/search.interface";

export class SearchRepository {
  async search(userId: string, query: string): Promise<GlobalSearchResult> {
    const searchRegex = {
      $regex: query,
      $options: "i",
    };

    /**
     * 1. Find ALL workspaces accessible to the user.
     *
     * Owner OR active member.
     */
    const [ownedWorkspaces, memberships] = await Promise.all([
      Workspace.find({
        owner: userId,
        isDeleted: { $ne: true },
      }).select("_id name description"),

      Membership.find({
        user: userId,
        status: "ACTIVE",
      }).select("workspace"),
    ]);

    const memberWorkspaceIds = memberships.map(
      (membership) => membership.workspace,
    );

    const accessibleWorkspaceIds = [
      ...new Set([
        ...ownedWorkspaces.map((workspace) => workspace._id.toString()),
        ...memberWorkspaceIds.map((workspaceId) => workspaceId.toString()),
      ]),
    ];

    /**
     * 2. Search workspaces.
     */
    const workspaces =
      accessibleWorkspaceIds.length > 0
        ? await Workspace.find({
            _id: {
              $in: accessibleWorkspaceIds,
            },
            isDeleted: { $ne: true },
            $or: [
              {
                name: searchRegex,
              },
              {
                description: searchRegex,
              },
            ],
          }).limit(20)
        : [];

    /**
     * 3. Search projects inside accessible workspaces.
     */
    const projects =
      accessibleWorkspaceIds.length > 0
        ? await Project.find({
            workspace: {
              $in: accessibleWorkspaceIds,
            },
            isDeleted: { $ne: true },
            $or: [
              {
                name: searchRegex,
              },
              {
                description: searchRegex,
              },
            ],
          })
            .populate("workspace", "name")
            .populate("owner", "firstName lastName email")
            .limit(20)
        : [];

    /**
     * 4. Find ALL accessible projects.
     *
     * Needed for task/comment search even when
     * the project name itself doesn't match.
     */
    const accessibleProjects =
      accessibleWorkspaceIds.length > 0
        ? await Project.find({
            workspace: {
              $in: accessibleWorkspaceIds,
            },
            isDeleted: { $ne: true },
          }).select("_id")
        : [];

    const accessibleProjectIds = accessibleProjects.map(
      (project) => project._id,
    );

    /**
     * 5. Search tasks inside accessible projects.
     */
    const tasks =
      accessibleProjectIds.length > 0
        ? await Task.find({
            project: {
              $in: accessibleProjectIds,
            },
            isDeleted: false,
            $or: [
              {
                title: searchRegex,
              },
              {
                description: searchRegex,
              },
            ],
          })
            .populate("project", "name")
            .populate("assignedTo", "firstName lastName email")
            .populate("createdBy", "firstName lastName email")
            .limit(20)
        : [];

    /**
     * 6. Find ALL accessible tasks.
     *
     * Needed for comment search.
     */
    const accessibleTasks =
      accessibleProjectIds.length > 0
        ? await Task.find({
            project: {
              $in: accessibleProjectIds,
            },
            isDeleted: false,
          }).select("_id")
        : [];

    const accessibleTaskIds = accessibleTasks.map((task) => task._id);

    /**
     * 7. Search comments belonging to
     *    accessible tasks.
     */
    const comments =
      accessibleTaskIds.length > 0
        ? await Comment.find({
            task: {
              $in: accessibleTaskIds,
            },
            isDeleted: false,
            content: searchRegex,
          })
            .populate("createdBy", "firstName lastName email")
            .populate("task", "title")
            .limit(20)
        : [];

    return {
      query,

      workspaces: {
        items: workspaces,
        total: workspaces.length,
      },

      projects: {
        items: projects,
        total: projects.length,
      },

      tasks: {
        items: tasks,
        total: tasks.length,
      },

      comments: {
        items: comments,
        total: comments.length,
      },

      total:
        workspaces.length + projects.length + tasks.length + comments.length,
    };
  }
}

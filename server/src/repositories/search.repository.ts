import { Workspace } from "../models/workspace.model";
import { Membership } from "../models/membership.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import { Comment } from "../models/comment.model";
import { User } from "../models/user.model";

import { GlobalSearchResult } from "../interfaces/search.interface";

export class SearchRepository {
  async search(userId: string, query: string): Promise<GlobalSearchResult> {
    const searchRegex = {
      $regex: query,
      $options: "i",
    };

    /**
     * 1. Search users
     *
     * Used by the Add Member UI.
     *
     * Search by:
     * - first name
     * - last name
     * - email
     */
    const users = await User.find({
      $or: [
        {
          firstName: searchRegex,
        },
        {
          lastName: searchRegex,
        },
        {
          email: searchRegex,
        },
      ],
    })
      .select("_id firstName lastName email")
      .limit(20)
      .exec();

    /**
     * 2. Find all workspaces accessible to the user.
     *
     * Access comes from:
     * - workspace ownership
     * - active membership
     */
    const [ownedWorkspaces, memberships] = await Promise.all([
      Workspace.find({
        owner: userId,
        isDeleted: { $ne: true },
      })
        .select("_id name description")
        .lean()
        .exec(),

      Membership.find({
        user: userId,
        status: "ACTIVE",
      })
        .select("workspace")
        .lean()
        .exec(),
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
     * 3. Search workspaces
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
          })
            .limit(20)
            .exec()
        : [];

    /**
     * 4. Search projects inside accessible workspaces
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
            .exec()
        : [];

    /**
     * 5. Find all accessible projects.
     *
     * Needed for task/comment search.
     */
    const accessibleProjects =
      accessibleWorkspaceIds.length > 0
        ? await Project.find({
            workspace: {
              $in: accessibleWorkspaceIds,
            },

            isDeleted: { $ne: true },
          })
            .select("_id")
            .lean()
            .exec()
        : [];

    const accessibleProjectIds = accessibleProjects.map(
      (project) => project._id,
    );

    /**
     * 6. Search tasks inside accessible projects
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
            .exec()
        : [];

    /**
     * 7. Find all accessible tasks.
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
          })
            .select("_id")
            .lean()
            .exec()
        : [];

    const accessibleTaskIds = accessibleTasks.map((task) => task._id);

    /**
     * 8. Search comments belonging to accessible tasks
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
            .exec()
        : [];

    /**
     * 9. Return global search result
     */
    return {
      query,

      users: {
        items: users,
        total: users.length,
      },

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
        users.length +
        workspaces.length +
        projects.length +
        tasks.length +
        comments.length,
    };
  }
}

import { Workspace } from "../models/workspace.model";
import { Membership } from "../models/membership.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import { Activity } from "../models/activity.model";
import { Notification } from "../models/notification.model";

export class DashboardRepository {
  /**
   * Get accessible workspace IDs
   */
  private async getWorkspaceIds(userId: string) {
    const [memberships, ownedWorkspaces] = await Promise.all([
      Membership.find({
        user: userId,
        status: "ACTIVE",
      }).select("workspace"),

      Workspace.find({
        owner: userId,
        isDeleted: { $ne: true },
      }).select("_id"),
    ]);

    const membershipWorkspaceIds = memberships.map((membership) =>
      membership.workspace.toString(),
    );

    const ownedWorkspaceIds = ownedWorkspaces.map((workspace) =>
      workspace._id.toString(),
    );

    return [...new Set([...ownedWorkspaceIds, ...membershipWorkspaceIds])];
  }

  /**
   * Get Dashboard
   */
  async getDashboard(userId: string) {
    const workspaceIds = await this.getWorkspaceIds(userId);

    /**
     * No accessible workspaces
     */
    if (workspaceIds.length === 0) {
      return {
        tasks: {
          total: 0,
          TODO: 0,
          IN_PROGRESS: 0,
          REVIEW: 0,
          DONE: 0,
        },

        priorities: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },

        myTasks: [],
        recentActivities: [],
        unreadNotifications: 0,
      };
    }

    /**
     * Get accessible projects
     */
    const projects = await Project.find({
      workspace: {
        $in: workspaceIds,
      },
      isDeleted: {
        $ne: true,
      },
    }).select("_id");

    const projectIds = projects.map((project) => project._id);

    /**
     * Base task query
     */
    const taskQuery = {
      project: {
        $in: projectIds,
      },
      isDeleted: false,
    };

    /**
     * Task and priority statistics
     */
    const [total, todo, inProgress, review, done, low, medium, high, critical] =
      await Promise.all([
        Task.countDocuments(taskQuery),

        Task.countDocuments({
          ...taskQuery,
          status: "TODO",
        }),

        Task.countDocuments({
          ...taskQuery,
          status: "IN_PROGRESS",
        }),

        Task.countDocuments({
          ...taskQuery,
          status: "REVIEW",
        }),

        Task.countDocuments({
          ...taskQuery,
          status: "DONE",
        }),

        Task.countDocuments({
          ...taskQuery,
          priority: "LOW",
        }),

        Task.countDocuments({
          ...taskQuery,
          priority: "MEDIUM",
        }),

        Task.countDocuments({
          ...taskQuery,
          priority: "HIGH",
        }),

        Task.countDocuments({
          ...taskQuery,
          priority: "CRITICAL",
        }),
      ]);

    /**
     * My assigned tasks
     */
    const myTasks = await Task.find({
      ...taskQuery,
      assignedTo: userId,
    })
      .populate("project", "name")
      .populate("assignedTo", "firstName lastName email")
      .sort({
        dueDate: 1,
        createdAt: -1,
      })
      .limit(10);

    /**
     * Recent activity
     */
    const recentActivities = await Activity.find({
      project: {
        $in: projectIds,
      },
    })
      .populate("user", "firstName lastName email")
      .sort({
        createdAt: -1,
      })
      .limit(10);

    /**
     * Unread notifications
     */
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isDeleted: false,
    });

    return {
      tasks: {
        total,
        TODO: todo,
        IN_PROGRESS: inProgress,
        REVIEW: review,
        DONE: done,
      },

      priorities: {
        LOW: low,
        MEDIUM: medium,
        HIGH: high,
        CRITICAL: critical,
      },

      myTasks,

      recentActivities,

      unreadNotifications,
    };
  }
}

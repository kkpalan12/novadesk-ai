import { Workspace } from "../models/workspace.model";
import { Membership } from "../models/membership.model";
import { Project } from "../models/project.model";
import { Task } from "../models/task.model";
import { Activity } from "../models/activity.model";
import { Notification } from "../models/notification.model";

export class DashboardRepository {
  /**
   * Get accessible workspace IDs
   *
   * Access comes from:
   * 1. Active membership
   * 2. Workspace ownership
   */
  private async getWorkspaceIds(userId: string): Promise<string[]> {
    const [memberships, ownedWorkspaces] = await Promise.all([
      Membership.find({
        user: userId,
        status: "ACTIVE",
      })
        .select("workspace")
        .lean()
        .exec(),

      Workspace.find({
        owner: userId,
        isDeleted: { $ne: true },
      })
        .select("_id")
        .lean()
        .exec(),
    ]);

    const membershipWorkspaceIds = memberships.map((membership) =>
      String(membership.workspace),
    );

    const ownedWorkspaceIds = ownedWorkspaces.map((workspace) =>
      String(workspace._id),
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
    })
      .select("_id")
      .lean()
      .exec();

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
        Task.countDocuments(taskQuery).exec(),

        Task.countDocuments({
          ...taskQuery,
          status: "TODO",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          status: "IN_PROGRESS",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          status: "REVIEW",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          status: "DONE",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          priority: "LOW",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          priority: "MEDIUM",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          priority: "HIGH",
        }).exec(),

        Task.countDocuments({
          ...taskQuery,
          priority: "CRITICAL",
        }).exec(),
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
      .limit(10)
      .exec();

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
      .limit(10)
      .exec();

    /**
     * Unread notifications
     */
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isDeleted: false,
    }).exec();

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

import { Task } from "../models/task.model";

export class DashboardRepository {
  async getDashboardStats() {
    const result = await Task.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,

          totalTasks: {
            $sum: 1,
          },

          completedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "DONE"] }, 1, 0],
            },
          },

          pendingTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "TODO"] }, 1, 0],
            },
          },

          inProgressTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0],
            },
          },

          reviewTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "REVIEW"] }, 1, 0],
            },
          },

          criticalTasks: {
            $sum: {
              $cond: [{ $eq: ["$priority", "CRITICAL"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,

          totalTasks: 1,

          completedTasks: 1,

          pendingTasks: 1,

          inProgressTasks: 1,

          reviewTasks: 1,

          criticalTasks: 1,

          completionRate: {
            $cond: [
              { $eq: ["$totalTasks", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: ["$completedTasks", "$totalTasks"],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
    ]);

    return (
      result[0] || {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        reviewTasks: 0,
        criticalTasks: 0,
        completionRate: 0,
      }
    );
  }
}

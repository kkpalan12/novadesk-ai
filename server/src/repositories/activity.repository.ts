import { Activity } from "../models/activity.model";
import { ActivityEntity } from "../entities/activity.entity";
import { paginate } from "../common/pagination/pagination.util";

export class ActivityRepository {
  /**
   * Create Activity
   */
  async create(entity: ActivityEntity) {
    return Activity.create(entity);
  }

  /**
   * Get Project Activities
   */
  async findByProject(projectId: string, page = 1, limit = 20) {
    const result = await paginate(
      Activity,
      {
        project: projectId,
      },
      {
        page,
        limit,
      },
      (query) =>
        query
          .populate("user", "firstName lastName email")
          .sort({ createdAt: -1 }),
    );

    return {
      activities: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get Activity By Id
   */
  async findById(id: string) {
    return Activity.findById(id)
      .populate("user", "firstName lastName email")
      .populate("project", "name workspace")
      .exec();
  }

  /**
   * Delete Activity
   */
  async delete(id: string) {
    return Activity.findByIdAndDelete(id).exec();
  }
}

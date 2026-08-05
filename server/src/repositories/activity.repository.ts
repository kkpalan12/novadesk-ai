import { Activity } from "../models/activity.model";
import { ActivityEntity } from "../entities/activity.entity";

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
    const skip = (page - 1) * limit;

    const activities = await Activity.find({
      project: projectId,
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments({
      project: projectId,
    });

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Activity By Id
   */
  async findById(id: string) {
    return Activity.findById(id).populate("user", "firstName lastName email");
  }

  /**
   * Delete Activity
   */
  async delete(id: string) {
    return Activity.findByIdAndDelete(id);
  }
}

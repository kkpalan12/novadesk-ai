import { ActivityRepository } from "../repositories/activity.repository";
import { ActivityMapper } from "../mappers/activity.mapper";
import { CreateActivityDto } from "../dto/activity/create-activity.dto";
import { NotFoundError } from "../common/errors/NotFoundError";

export class ActivityService {
  private readonly repository = new ActivityRepository();

  /**
   * Create Activity
   */
  async createActivity(dto: CreateActivityDto) {
    const entity = ActivityMapper.toEntity(dto);

    return this.repository.create(entity);
  }

  /**
   * Get Project Activities
   */
  async getProjectActivities(projectId: string, page = 1, limit = 20) {
    return this.repository.findByProject(projectId, page, limit);
  }

  /**
   * Get Activity
   */
  async getActivity(id: string) {
    const activity = await this.repository.findById(id);

    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    return activity;
  }

  /**
   * Delete Activity
   */
  async deleteActivity(id: string) {
    const activity = await this.repository.delete(id);

    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    return activity;
  }
}

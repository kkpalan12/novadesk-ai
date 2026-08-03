import { TaskHistory } from "../models/task-history.model";
import { TaskAction } from "../interfaces/task-history.interface";

export class TaskHistoryRepository {
  async create(data: {
    task: string;
    action: TaskAction;
    oldValue?: string;
    newValue?: string;
    performedBy: string;
  }) {
    return TaskHistory.create(data);
  }

  async getTaskHistory(taskId: string) {
    return TaskHistory.find({
      task: taskId,
    })
      .populate("performedBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      });
  }
}

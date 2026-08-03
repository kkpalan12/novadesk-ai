import { TaskHistoryRepository } from "../repositories/task-history.repository";
import { TaskAction } from "../interfaces/task-history.interface";

export class TaskHistoryService {
  private readonly taskHistoryRepository = new TaskHistoryRepository();

  /**
   * Create History
   */
  async createHistory(data: {
    task: string;
    action: TaskAction;
    oldValue?: string;
    newValue?: string;
    performedBy: string;
  }) {
    return this.taskHistoryRepository.create(data);
  }

  /**
   * Get Task History
   */
  async getTaskHistory(taskId: string) {
    return this.taskHistoryRepository.getTaskHistory(taskId);
  }
}

import { CreateTaskDto } from "../dto/task/create-task.dto";
import { TaskRepository } from "../repositories/task.repository";

export class TaskService {
  private taskRepository = new TaskRepository();

  async createTask(
    taskData: CreateTaskDto,
    createdBy: string
  ) {
    return this.taskRepository.create({
      ...taskData,
      createdBy,
    });
  }

  async getAllTasks() {
    return this.taskRepository.findAll();
  }

  async getTaskById(id: string) {
    return this.taskRepository.findById(id);
  }
}
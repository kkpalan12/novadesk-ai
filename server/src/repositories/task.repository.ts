import { Task } from "../models/task.model";
import { CreateTaskDto } from "../dto/task/create-task.dto";
import { CreateTaskData } from "../interfaces/task.interface";

export class TaskRepository {
async create(task: CreateTaskData) {
    return Task.create(task);
}

  async findById(id: string) {
    return Task.findById(id)
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  async findAll() {
    return Task.find()
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName")
      .sort({
        createdAt: -1,
      });
  }
}
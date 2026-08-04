import { TaskEntity } from "../entities/task.entity";
import { CreateTaskDto } from "../dto/task/create-task.dto";

export class TaskMapper {
  static toEntity(dto: CreateTaskDto, createdBy: string): TaskEntity {
    return new TaskEntity({
      project: dto.project,
      title: dto.title,
      description: dto.description,
      createdBy,
      assignedTo: dto.assignedTo,
      priority: dto.priority,
      dueDate: dto.dueDate,
    });
  }
}

import { CreateTaskDto } from "../dto/task/create-task.dto";
import { TaskEntity } from "../entities/task.entity";

export class TaskMapper {
  static toEntity(dto: CreateTaskDto, createdBy: string) {
    return new TaskEntity({
      ...dto,

      createdBy,
    });
  }
}

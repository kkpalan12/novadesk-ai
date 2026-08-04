import { Task } from "../models/task.model";
import { TaskEntity } from "../entities/task.entity";
import { UpdateTaskDto } from "../dto/task/update-task.dto";

export class TaskRepository {
  /**
   * Create Task
   */
  async create(entity: TaskEntity) {
    return Task.create(entity);
  }

  /**
   * Get Task By Id
   */
  async findById(id: string) {
    return Task.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate("project", "name")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  /**
   * Get All Tasks
   */
  async findAll(filters: {
    page: number;
    limit: number;
    project?: string;
    search?: string;
    status?: string;
    priority?: string;
    sort?: string;
  }) {
    const { page, limit, search, status, priority, sort } = filters;

    const query: Record<string, any> = {
      isDeleted: { $ne: true },
    };
    if (filters.project) {
      query.project = filters.project;
    }

    if (search) {
      query.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate("project", "name")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort(sort ? { [sort]: 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(query);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update Task
   */
  async update(id: string, updateData: UpdateTaskDto) {
    return Task.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );
  }

  /**
   * Soft Delete Task
   */
  async softDelete(id: string) {
    return Task.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
      {
        new: true,
      },
    );
  }

  /**
   * Change Task Status
   */
  async updateStatus(id: string, status: string) {
    return Task.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        status,
      },
      {
        new: true,
      },
    );
  }

  /**
   * Assign Task
   */
  async assignTask(id: string, assignedTo: string) {
    return Task.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        assignedTo,
      },
      {
        new: true,
      },
    );
  }
}

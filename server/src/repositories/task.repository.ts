import { FilterQuery, ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";
import { paginate } from "../common/pagination/pagination.util";

import { Task } from "../models/task.model";
import { ITask } from "../interfaces/task.interface";
import { UpdateTaskDto } from "../dto/task/update-task.dto";
import { Comment } from "../models/comment.model";
import { Attachment } from "../models/attachment.model";

export class TaskRepository extends BaseRepository<ITask> {
  constructor() {
    super(Task);
  }

  /**
   * Get Task By Id
   *
   * Optionally restrict lookup to a specific project.
   */
  async findById(id: string, projectId?: string) {
    const query: FilterQuery<ITask> = {
      _id: id,
      isDeleted: { $ne: true },
    };

    if (projectId) {
      query.project = projectId;
    }

    return this.model
      .findOne(query)
      .populate("project", "name")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .exec();
  }

  /**
   * Get All Tasks
   *
   * Supports:
   * - Project filtering
   * - Search
   * - Status filtering
   * - Priority filtering
   * - Sorting
   * - Pagination
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
    const { page, limit, project, search, status, priority, sort } = filters;

    const query: FilterQuery<ITask> = {
      isDeleted: {
        $ne: true,
      },
    };

    if (project) {
      query.project = project;
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

    const result = await paginate(
      this.model,

      query,

      {
        page,
        limit,
      },

      (queryBuilder) =>
        queryBuilder

          .populate("project", "name")

          .populate("assignedTo", "firstName lastName email")

          .populate("createdBy", "firstName lastName email")

          .sort(
            sort
              ? {
                  [sort]: 1,
                }
              : {
                  createdAt: -1,
                },
          ),
    );

    const tasksWithMetadata = await Promise.all(
      result.data.map(async (task) => {
        const [commentsCount, attachmentsCount] = await Promise.all([
          Comment.countDocuments({
            task: task._id,

            isDeleted: false,
          }),

          Attachment.countDocuments({
            task: task._id,

            isDeleted: false,
          }),
        ]);

        return {
          ...task.toObject(),

          commentsCount,

          attachmentsCount,
        };
      }),
    );

    return {
      tasks: tasksWithMetadata,

      total: result.total,

      page: result.page,

      limit: result.limit,

      totalPages: result.totalPages,
    };
  }
  /**
   * Update Task
   */
  async update(id: string, updateData: UpdateTaskDto, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        updateData,
        {
          new: true,
          runValidators: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Soft Delete Task
   */
  async softDelete(id: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Update Task Status
   */
  async updateStatus(id: string, status: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          status,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Assign Task
   */
  async assignTask(id: string, assignedTo: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          assignedTo,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }
}

import { Comment } from "../models/comment.model";
import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

export class CommentRepository {
  async create(data: CreateCommentDto) {
    return Comment.create(data);
  }

  async findByTask(taskId: string) {
    return Comment.find({
      task: taskId,
      isDeleted: false,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return Comment.findById(id);
  }

  async update(id: string, data: Partial<UpdateCommentDto>) {
    return Comment.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async softDelete(id: string) {
    return Comment.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
      },
      {
        new: true,
      },
    );
  }
}

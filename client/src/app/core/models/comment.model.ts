export interface CommentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Comment {
  _id: string;
  task: string;
  content: string;
  createdBy: CommentUser | string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  success: boolean;
  message: string;
  data: Comment[];
}

export interface CommentResponse {
  success: boolean;
  message: string;
  data: Comment;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

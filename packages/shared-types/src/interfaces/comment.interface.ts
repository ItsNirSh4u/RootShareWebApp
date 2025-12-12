export interface IComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentCreate {
  postId: string;
  content: string;
}

export interface ICommentUpdate {
  content: string;
}

export interface ICommentWithUser extends IComment {
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
}

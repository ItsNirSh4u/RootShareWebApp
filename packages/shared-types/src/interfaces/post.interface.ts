import { PostType } from '../enums';

export interface IPost {
  id: string;
  userId: string;
  plantId?: string; // Optional - user might post a general question
  type: PostType;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostCreate {
  plantId?: string;
  type: PostType;
  content: string;
  images: string[];
}

export interface IPostUpdate {
  content?: string;
  images?: string[];
  type?: PostType;
}

export interface IPostWithDetails extends IPost {
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  plant?: {
    id: string;
    name: string;
    species: string;
  };
  isLiked?: boolean; // For current user
}

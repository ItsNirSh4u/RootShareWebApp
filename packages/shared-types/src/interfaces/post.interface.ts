import { PostType } from '../enums';

export interface IPost {
  id: string;
  userId: string;
  plantId?: string;
  type: PostType;
  content: string;
  images: string[];
  location?: string;
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
  location?: string;
}

export interface IPostUpdate {
  content?: string;
  images?: string[];
  type?: PostType;
  location?: string;
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
  isLiked?: boolean;
}

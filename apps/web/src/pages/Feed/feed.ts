import api from '@/lib/api';
import type { IPostWithDetails, IPlant, IPostCreate, IPostUpdate, ICommentWithUser } from '@rootshare/shared-types';
import { PostType } from '@rootshare/shared-types';

export type PostFilter = { type?: PostType | 'all'; search?: string };

export type PopulatedUser = { _id: string; username: string; profileImageUrl?: string };
export type PopulatedPlant = { _id: string; name: string; species: string };

export type RawPost = Omit<IPostWithDetails, 'user' | 'plant'> & {
  userId: PopulatedUser | string;
  plantId?: PopulatedPlant | string | null;
};

function isPopulatedUser(v: PopulatedUser | string): v is PopulatedUser {
  return typeof v === 'object';
}

function isPopulatedPlant(v: PopulatedPlant | string): v is PopulatedPlant {
  return typeof v === 'object';
}

export function mapPost(raw: RawPost): IPostWithDetails {
  const user = isPopulatedUser(raw.userId)
    ? { id: raw.userId._id, username: raw.userId.username, profileImageUrl: raw.userId.profileImageUrl }
    : { id: String(raw.userId), username: 'Unknown' };

  const plant =
    raw.plantId && isPopulatedPlant(raw.plantId)
      ? { id: raw.plantId._id, name: raw.plantId.name, species: raw.plantId.species }
      : undefined;

  return { ...raw, user, plant };
}

export async function fetchPosts(): Promise<IPostWithDetails[]> {
  const response = await api.get<RawPost[]>('/posts');
  return response.data.map(mapPost);
}

type RawPlant = Omit<IPlant, 'id'> & { _id: string };

export async function fetchFeaturedPlants(): Promise<IPlant[]> {
  const response = await api.get<RawPlant[]>('/plants/featured', { params: { limit: 10 } });
  return response.data.map((p) => ({ ...p, id: p._id }));
}

export async function fetchUserPlants(): Promise<IPlant[]> {
  const response = await api.get<RawPlant[]>('/plants');
  return response.data.map((p) => ({ ...p, id: p._id }));
}

export async function toggleLikePost(postId: string): Promise<{ liked: boolean }> {
  const response = await api.post<{ liked: boolean }>(`/likes/posts/${postId}/toggle`);
  return response.data;
}

export async function createPost(data: IPostCreate): Promise<IPostWithDetails> {
  const response = await api.post<RawPost>('/posts', data);
  return mapPost(response.data);
}

export async function updatePost(id: string, data: IPostUpdate): Promise<IPostWithDetails> {
  const response = await api.patch<RawPost>(`/posts/${id}`, data);
  return mapPost(response.data);
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}

type RawComment = {
  commentId: string;
  postId: string;
  userId: { _id: string; username: string; profileImageUrl?: string } | string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapComment(raw: RawComment): ICommentWithUser {
  const user =
    raw.userId !== null && typeof raw.userId === 'object'
      ? { id: raw.userId._id, username: raw.userId.username, profileImageUrl: raw.userId.profileImageUrl }
      : { id: String(raw.userId), username: 'Unknown' };
  return {
    id: raw.commentId,
    postId: String(raw.postId),
    userId: user.id,
    content: raw.content,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    user,
  };
}

export async function fetchComments(postId: string): Promise<ICommentWithUser[]> {
  const response = await api.get<RawComment[]>(`/comments/post/${postId}`);
  return response.data.map(mapComment);
}

export async function addComment(postId: string, content: string): Promise<void> {
  await api.post('/comments', { postId, content });
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

export async function updateComment(commentId: string, content: string): Promise<void> {
  await api.patch('/comments', { commentId, content });
}

export async function uploadPostImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.postForm<{ url: string }>('/posts/images', formData);
  return response.data.url;
}

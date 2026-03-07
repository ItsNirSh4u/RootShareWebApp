import api from '@/lib/api';
import type { IPostWithDetails, IPlant } from '@rootshare/shared-types';
import { PostType } from '@rootshare/shared-types';

export type PostFilter = { type?: PostType | 'all'; search?: string };

export async function fetchPosts(): Promise<IPostWithDetails[]> {
  const response = await api.get<IPostWithDetails[]>('/posts');
  return response.data;
}

export async function fetchFeaturedPlants(): Promise<IPlant[]> {
  const response = await api.get<IPlant[]>('/plants/featured', { params: { limit: 10 } });
  return response.data;
}

export async function toggleLikePost(postId: string): Promise<void> {
  await api.post(`/likes/posts/${postId}`);
}

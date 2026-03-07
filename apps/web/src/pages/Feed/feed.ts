import api from '@/lib/api';
import type { IPostWithDetails, IPlant } from '@rootshare/shared-types';
import { PostType } from '@rootshare/shared-types';

export type PostFilter = { type?: PostType | 'all'; search?: string };

type PopulatedUser = { _id: string; username: string; profileImageUrl?: string };
type PopulatedPlant = { _id: string; name: string; species: string };

type RawPost = Omit<IPostWithDetails, 'user' | 'plant'> & {
  userId: PopulatedUser | string;
  plantId?: PopulatedPlant | string | null;
};

function isPopulatedUser(v: PopulatedUser | string): v is PopulatedUser {
  return typeof v === 'object';
}

function isPopulatedPlant(v: PopulatedPlant | string): v is PopulatedPlant {
  return typeof v === 'object';
}

function mapPost(raw: RawPost): IPostWithDetails {
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

export async function fetchFeaturedPlants(): Promise<IPlant[]> {
  const response = await api.get<IPlant[]>('/plants/featured', { params: { limit: 10 } });
  return response.data;
}

export async function toggleLikePost(postId: string): Promise<void> {
  await api.post(`/likes/posts/${postId}`);
}

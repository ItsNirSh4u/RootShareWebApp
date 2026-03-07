import api from '@/lib/api';
import type { IPostWithDetails, IPlant, IUser } from '@rootshare/shared-types';
import type { IUserUpdate } from '@rootshare/shared-types';

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

export async function fetchUserPosts(userId: string): Promise<IPostWithDetails[]> {
  const response = await api.get<RawPost[]>('/posts');
  return response.data.map(mapPost).filter((post) => post.user.id === userId);
}

export async function fetchUserPlants(): Promise<IPlant[]> {
  const response = await api.get<IPlant[]>('/plants');
  return response.data;
}

export async function updateProfile(data: IUserUpdate): Promise<IUser> {
  const response = await api.put<IUser>('/users/profile', data);
  return response.data;
}

export async function uploadProfileImage(file: File): Promise<IUser> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post<IUser>('/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

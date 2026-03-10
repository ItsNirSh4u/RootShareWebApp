import api from '@/lib/api';
import type { IPostWithDetails, IPlant, IUser, IUserUpdate } from '@rootshare/shared-types';
import { mapPost, type RawPost } from '@/pages/Feed/feed';

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

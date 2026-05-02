import api from '@/lib/api';
import type { IPostWithDetails, IPlant, IPlantWithStats, IUser, IUserUpdate } from '@rootshare/shared-types';
import { mapPost, type RawPost } from '@/pages/Feed/feed';

export async function fetchUserPosts(userId: string): Promise<IPostWithDetails[]> {
  const response = await api.get<RawPost[]>('/posts');
  return response.data.map(mapPost).filter((post) => post.user.id === userId);
}

type RawPlant = Omit<IPlant, 'id'> & { _id: string };
type RawPlantWithStats = Omit<IPlantWithStats, 'id'> & { _id: string };

export async function fetchUserPlants(): Promise<IPlantWithStats[]> {
  const response = await api.get<RawPlantWithStats[]>('/plants/with-stats');
  return response.data.map((p) => ({ ...p, id: p._id }));
}

export async function fetchUserPlantsByUserId(userId: string): Promise<IPlantWithStats[]> {
  const response = await api.get<RawPlantWithStats[]>(`/plants/user/${userId}`);
  return response.data.map((p) => ({ ...p, id: p._id }));
}

export async function fetchUserById(userId: string): Promise<IUser> {
  const response = await api.get<IUser>(`/users/${userId}`);
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

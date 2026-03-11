import api from '@/lib/api';
import type { IPlant, IPlantCreate, IPlantUpdate, IPlantWithStats, IPostWithDetails } from '@rootshare/shared-types';
import { mapPost, type RawPost } from '@/pages/Feed/feed';

type RawPlant = Omit<IPlant, 'id'> & { _id: string };
type RawPlantWithStats = Omit<IPlantWithStats, 'id'> & { _id: string };

export async function fetchGardenPlants(): Promise<IPlantWithStats[]> {
  const res = await api.get<RawPlantWithStats[]>('/plants/with-stats');
  return res.data.map((p) => ({ ...p, id: p._id }));
}

export async function fetchPlantPosts(plantId: string): Promise<IPostWithDetails[]> {
  const res = await api.get<RawPost[]>('/posts', { params: { plantId } });
  return res.data.map(mapPost);
}

export async function createPlant(data: IPlantCreate): Promise<IPlant> {
  const res = await api.post<RawPlant>('/plants', data);
  return { ...res.data, id: res.data._id };
}

export async function updatePlant(id: string, data: IPlantUpdate): Promise<IPlant> {
  const res = await api.patch<RawPlant>(`/plants/${id}`, data);
  return { ...res.data, id: res.data._id };
}

export async function deletePlant(id: string): Promise<void> {
  await api.delete(`/plants/${id}`);
}

export async function uploadPlantImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post<{ url: string }>('/plants/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}

export async function fetchSpeciesList(): Promise<string[]> {
  const res = await api.get<{ _id: string; name: string }[]>('/species');
  return res.data.map((s) => s.name);
}

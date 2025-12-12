import { PlantStatus } from '../enums';

export interface IPlant {
  id: string;
  userId: string;
  name: string;
  species: string;
  status: PlantStatus;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlantCreate {
  name: string;
  species: string;
  imageUrl: string;
}

export interface IPlantUpdate {
  name?: string;
  species?: string;
  status?: PlantStatus;
  imageUrl?: string;
}

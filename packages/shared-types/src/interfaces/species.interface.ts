import { SpeciesRequestStatus } from '../enums';

export interface ISpecies {
  id: string;
  name: string;
  scientificName?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpeciesCreate {
  name: string;
  scientificName?: string;
  description?: string;
}

export interface ISpeciesRequest {
  id: string;
  userId: string;
  name: string;
  scientificName?: string;
  description?: string;
  reason: string;
  status: SpeciesRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpeciesRequestCreate {
  name: string;
  scientificName?: string;
  description?: string;
  reason: string;
}

export interface ISpeciesRequestReview {
  status: SpeciesRequestStatus.APPROVED | SpeciesRequestStatus.REJECTED;
  rejectionReason?: string;
}

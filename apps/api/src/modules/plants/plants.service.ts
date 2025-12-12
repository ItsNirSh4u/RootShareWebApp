import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plant, PlantDocument } from './schemas/plant.schema';

@Injectable()
export class PlantsService {
  constructor(@InjectModel(Plant.name) private plantModel: Model<PlantDocument>) {}

  // TODO: Implement CRUD operations for plants
  // - create(userId: string, plantData: IPlantCreate)
  // - findAll(userId: string, filters?: { status?: PlantStatus })
  // - findOne(id: string, userId: string)
  // - update(id: string, userId: string, updateData: IPlantUpdate)
  // - remove(id: string, userId: string)
}

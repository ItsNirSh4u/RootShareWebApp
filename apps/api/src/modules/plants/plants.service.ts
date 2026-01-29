import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Plant, PlantDocument } from './schemas/plant.schema';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { SpeciesService } from '../species/species.service';
import { PlantStatus } from '@rootshare/shared-types';

@Injectable()
export class PlantsService {
  constructor(
    @InjectModel(Plant.name) private plantModel: Model<PlantDocument>,
    private readonly speciesService: SpeciesService,
  ) {}

  async create(
    userId: string,
    createPlantDto: CreatePlantDto,
  ): Promise<PlantDocument> {
    // Validate that the species exists in the approved list
    const speciesExists = await this.speciesService.speciesExists(
      createPlantDto.species,
    );

    if (!speciesExists) {
      throw new BadRequestException(
        `Species "${createPlantDto.species}" is not in the approved species list. Please submit a species request.`,
      );
    }

    const newPlant = new this.plantModel({
      ...createPlantDto,
      userId: new Types.ObjectId(userId),
      status: PlantStatus.ACTIVE,
    });

    return newPlant.save();
  }

  async findAll(
    userId: string,
    filters?: { status?: PlantStatus },
  ): Promise<PlantDocument[]> {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.plantModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<PlantDocument> {
    const plant = await this.plantModel.findById(id).exec();

    if (!plant) {
      throw new NotFoundException(`Plant with ID "${id}" not found`);
    }

    return plant;
  }

  async update(
    plant: PlantDocument,
    updatePlantDto: UpdatePlantDto,
  ): Promise<PlantDocument> {
    // If species is being updated, validate it
    if (updatePlantDto.species) {
      const speciesExists = await this.speciesService.speciesExists(
        updatePlantDto.species,
      );

      if (!speciesExists) {
        throw new BadRequestException(
          `Species "${updatePlantDto.species}" is not in the approved species list. Please submit a species request.`,
        );
      }
    }

    Object.assign(plant, updatePlantDto);
    return plant.save();
  }

  async remove(plant: PlantDocument): Promise<{ deleted: boolean; id: string }> {
    const id = plant._id.toString();
    await plant.deleteOne();
    return { deleted: true, id };
  }
}

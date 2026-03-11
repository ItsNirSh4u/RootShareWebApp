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
    @InjectModel('Post') private postModel: Model<Record<string, unknown>>,
    private readonly speciesService: SpeciesService,
  ) {}

  async create(
    userId: string,
    createPlantDto: CreatePlantDto,
  ): Promise<PlantDocument> {
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

  async findFeatured(limit: number = 10): Promise<PlantDocument[]> {
    return this.plantModel
      .find({ status: PlantStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findAllWithStats(userId: string): Promise<Record<string, unknown>[]> {
    const plants = await this.plantModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    if (plants.length === 0) return [];

    const plantIds = plants.map((p) => p._id);

    const stats = await this.postModel.aggregate([
      { $match: { plantId: { $in: plantIds } } },
      {
        $group: {
          _id: '$plantId',
          postsCount: { $sum: 1 },
          commentsCount: { $sum: '$commentsCount' },
        },
      },
    ]);

    const statsMap = new Map(
      stats.map((s) => [
        s._id.toString(),
        { postsCount: s.postsCount, commentsCount: s.commentsCount },
      ]),
    );

    return plants.map((plant) => {
      const plantStats = statsMap.get(plant._id.toString()) ?? { postsCount: 0, commentsCount: 0 };
      return { ...plant.toObject(), id: plant._id.toString(), ...plantStats };
    });
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

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Species, SpeciesDocument } from './schemas/species.schema';
import {
  SpeciesRequest,
  SpeciesRequestDocument,
} from './schemas/species-request.schema';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { CreateSpeciesRequestDto } from './dto/create-species-request.dto';
import { ReviewSpeciesRequestDto } from './dto/review-species-request.dto';
import { SpeciesRequestStatus } from '@rootshare/shared-types';

@Injectable()
export class SpeciesService {
  private readonly logger = new Logger(SpeciesService.name);

  constructor(
    @InjectModel(Species.name) private speciesModel: Model<SpeciesDocument>,
    @InjectModel(SpeciesRequest.name)
    private speciesRequestModel: Model<SpeciesRequestDocument>,
  ) {}


  async createSpecies(createSpeciesDto: CreateSpeciesDto): Promise<SpeciesDocument> {
    const existingSpecies = await this.speciesModel
      .findOne({ name: { $regex: new RegExp(`^${createSpeciesDto.name}$`, 'i') } })
      .exec();

    if (existingSpecies) {
      throw new ConflictException(
        `Species with name "${createSpeciesDto.name}" already exists`,
      );
    }

    const newSpecies = new this.speciesModel(createSpeciesDto);
    return newSpecies.save();
  }

  async findAllSpecies(): Promise<SpeciesDocument[]> {
    return this.speciesModel.find().sort({ name: 1 }).exec();
  }

  async findSpeciesById(id: string): Promise<SpeciesDocument> {
    const species = await this.speciesModel.findById(id).exec();
    if (!species) {
      throw new NotFoundException(`Species with ID "${id}" not found`);
    }
    return species;
  }

  async findSpeciesByName(name: string): Promise<SpeciesDocument | null> {
    return this.speciesModel
      .findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
      .exec();
  }

  async speciesExists(name: string): Promise<boolean> {
    const species = await this.findSpeciesByName(name);
    return species !== null;
  }

  async deleteSpecies(id: string): Promise<{ deleted: boolean; id: string }> {
    const species = await this.findSpeciesById(id);
    await species.deleteOne();
    return { deleted: true, id };
  }


  async createSpeciesRequest(
    userId: string,
    createRequestDto: CreateSpeciesRequestDto,
  ): Promise<SpeciesRequestDocument> {
    const existingSpecies = await this.findSpeciesByName(createRequestDto.name);
    if (existingSpecies) {
      throw new ConflictException(
        `Species "${createRequestDto.name}" already exists in the database`,
      );
    }

    // Check if there's already a pending request for this species
    const existingRequest = await this.speciesRequestModel
      .findOne({
        name: { $regex: new RegExp(`^${createRequestDto.name}$`, 'i') },
        status: SpeciesRequestStatus.PENDING,
      })
      .exec();

    if (existingRequest) {
      throw new ConflictException(
        `A request for species "${createRequestDto.name}" is already pending`,
      );
    }

    const newRequest = new this.speciesRequestModel({
      ...createRequestDto,
      userId: new Types.ObjectId(userId),
    });

    const saved = await newRequest.save();
    this.logger.log({ userId, speciesName: createRequestDto.name, event: 'species_request_created' }, `Species request submitted: ${createRequestDto.name}`);
    return saved;
  }

  async findAllSpeciesRequests(
    status?: SpeciesRequestStatus,
  ): Promise<SpeciesRequestDocument[]> {
    const query = status ? { status } : {};
    return this.speciesRequestModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findSpeciesRequestById(id: string): Promise<SpeciesRequestDocument> {
    const request = await this.speciesRequestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException(`Species request with ID "${id}" not found`);
    }
    return request;
  }

  async findUserSpeciesRequests(
    userId: string,
  ): Promise<SpeciesRequestDocument[]> {
    return this.speciesRequestModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async reviewSpeciesRequest(
    requestId: string,
    adminUserId: string,
    reviewDto: ReviewSpeciesRequestDto,
  ): Promise<SpeciesRequestDocument> {
    const request = await this.findSpeciesRequestById(requestId);

    if (request.status !== SpeciesRequestStatus.PENDING) {
      throw new BadRequestException(
        `This request has already been ${request.status}`,
      );
    }

    // Validate rejection reason is provided when rejecting
    if (
      reviewDto.status === SpeciesRequestStatus.REJECTED &&
      !reviewDto.rejectionReason
    ) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a request',
      );
    }

    // Update the request
    request.status = reviewDto.status;
    request.reviewedBy = new Types.ObjectId(adminUserId);
    request.reviewedAt = new Date();

    if (reviewDto.status === SpeciesRequestStatus.REJECTED) {
      request.rejectionReason = reviewDto.rejectionReason;
    }

    await request.save();

    // If approved, create the species
    if (reviewDto.status === SpeciesRequestStatus.APPROVED) {
      await this.createSpecies({
        name: request.name,
        scientificName: request.scientificName,
        description: request.description,
      });
    }

    this.logger.log(
      { requestId, adminUserId, speciesName: request.name, status: reviewDto.status, event: 'species_request_reviewed' },
      `Species request ${reviewDto.status}: ${request.name}`,
    );

    return request;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { Plant } from './schemas/plant.schema';
import { SpeciesService } from '../species/species.service';
import { PlantStatus } from '@rootshare/shared-types';
import { Types } from 'mongoose';

describe('PlantsService', () => {
  let service: PlantsService;
  let mockPlantModel: any;
  let mockSpeciesService: jest.Mocked<SpeciesService>;

  const mockUserId = new Types.ObjectId().toString();
  const mockPlantId = new Types.ObjectId();

  const mockPlant = {
    _id: mockPlantId,
    userId: new Types.ObjectId(mockUserId),
    name: 'My Monstera',
    species: 'Monstera',
    status: PlantStatus.ACTIVE,
    imageUrl: 'https://example.com/plant.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const mockPlantModelConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockPlant, ...data }),
    }));

    mockPlantModel = Object.assign(mockPlantModelConstructor, {
      find: jest.fn(),
      findById: jest.fn(),
    });

    mockSpeciesService = {
      speciesExists: jest.fn(),
      createSpecies: jest.fn(),
      findAllSpecies: jest.fn(),
      findSpeciesById: jest.fn(),
      findSpeciesByName: jest.fn(),
      deleteSpecies: jest.fn(),
      createSpeciesRequest: jest.fn(),
      findAllSpeciesRequests: jest.fn(),
      findSpeciesRequestById: jest.fn(),
      findUserSpeciesRequests: jest.fn(),
      reviewSpeciesRequest: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantsService,
        {
          provide: getModelToken(Plant.name),
          useValue: mockPlantModel,
        },
        {
          provide: getModelToken('Post'),
          useValue: {},
        },
        {
          provide: SpeciesService,
          useValue: mockSpeciesService,
        },
      ],
    }).compile();

    service = module.get<PlantsService>(PlantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPlantDto = {
      name: 'My Monstera',
      species: 'Monstera',
      imageUrl: 'https://example.com/plant.jpg',
    };

    it('should create a new plant when species exists', async () => {
      mockSpeciesService.speciesExists.mockResolvedValue(true);

      const result = await service.create(mockUserId, createPlantDto);

      expect(mockSpeciesService.speciesExists).toHaveBeenCalledWith('Monstera');
      expect(mockPlantModel).toHaveBeenCalledWith({
        ...createPlantDto,
        userId: expect.any(Types.ObjectId),
        status: PlantStatus.ACTIVE,
      });
      expect(result).toHaveProperty('name', createPlantDto.name);
    });

    it('should throw BadRequestException when species does not exist', async () => {
      mockSpeciesService.speciesExists.mockResolvedValue(false);

      await expect(service.create(mockUserId, createPlantDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSpeciesService.speciesExists).toHaveBeenCalledWith('Monstera');
    });
  });

  describe('findAll', () => {
    it('should return all plants for a user', async () => {
      const mockPlants = [mockPlant, { ...mockPlant, _id: new Types.ObjectId() }];
      mockPlantModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPlants),
        }),
      });

      const result = await service.findAll(mockUserId);

      expect(mockPlantModel.find).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
      });
      expect(result).toEqual(mockPlants);
    });

    it('should filter plants by status', async () => {
      const mockPlants = [mockPlant];
      mockPlantModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPlants),
        }),
      });

      const result = await service.findAll(mockUserId, {
        status: PlantStatus.ACTIVE,
      });

      expect(mockPlantModel.find).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
        status: PlantStatus.ACTIVE,
      });
      expect(result).toEqual(mockPlants);
    });
  });

  describe('findOne', () => {
    it('should return a plant by id', async () => {
      mockPlantModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlant),
      });

      const result = await service.findOne(mockPlantId.toString());

      expect(mockPlantModel.findById).toHaveBeenCalledWith(
        mockPlantId.toString(),
      );
      expect(result).toEqual(mockPlant);
    });

    it('should throw NotFoundException if plant not found', async () => {
      mockPlantModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updatePlantDto = {
      name: 'Updated Monstera',
    };

    it('should update a plant', async () => {
      const plantDocument = {
        ...mockPlant,
        save: jest.fn().mockResolvedValue({ ...mockPlant, ...updatePlantDto }),
      };

      const result = await service.update(plantDocument as any, updatePlantDto);

      expect(plantDocument.save).toHaveBeenCalled();
      expect(result.name).toBe(updatePlantDto.name);
    });

    it('should validate species when updating species field', async () => {
      const updateWithSpecies = {
        species: 'Snake Plant',
      };
      mockSpeciesService.speciesExists.mockResolvedValue(true);

      const plantDocument = {
        ...mockPlant,
        save: jest
          .fn()
          .mockResolvedValue({ ...mockPlant, ...updateWithSpecies }),
      };

      await service.update(plantDocument as any, updateWithSpecies);

      expect(mockSpeciesService.speciesExists).toHaveBeenCalledWith(
        'Snake Plant',
      );
    });

    it('should throw BadRequestException when updating to invalid species', async () => {
      const updateWithInvalidSpecies = {
        species: 'Invalid Species',
      };
      mockSpeciesService.speciesExists.mockResolvedValue(false);

      const plantDocument = {
        ...mockPlant,
        save: jest.fn(),
      };

      await expect(
        service.update(plantDocument as any, updateWithInvalidSpecies),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a plant and return confirmation', async () => {
      const plantDocument = {
        ...mockPlant,
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };

      const result = await service.remove(plantDocument as any);

      expect(plantDocument.deleteOne).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: true,
        id: mockPlantId.toString(),
      });
    });
  });
});

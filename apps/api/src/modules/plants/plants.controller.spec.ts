import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';
import { PlantOwnerGuard } from './guards/plant-owner.guard';
import { Plant } from './schemas/plant.schema';
import { PlantStatus } from '@rootshare/shared-types';
import { Types } from 'mongoose';

describe('PlantsController', () => {
  let controller: PlantsController;
  let plantsService: jest.Mocked<PlantsService>;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantsController],
      providers: [
        {
          provide: PlantsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getModelToken(Plant.name),
          useValue: {},
        },
        PlantOwnerGuard,
      ],
    }).compile();

    controller = module.get<PlantsController>(PlantsController);
    plantsService = module.get(PlantsService);
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

    it('should create a new plant', async () => {
      const mockRequest = { user: { id: mockUserId } };
      plantsService.create.mockResolvedValue(mockPlant as any);

      const result = await controller.create(mockRequest, createPlantDto);

      expect(plantsService.create).toHaveBeenCalledWith(
        mockUserId,
        createPlantDto,
      );
      expect(result).toEqual(mockPlant);
    });
  });

  describe('findAll', () => {
    it('should return all plants for the user', async () => {
      const mockRequest = { user: { id: mockUserId } };
      const mockPlants = [mockPlant, { ...mockPlant, _id: new Types.ObjectId() }];
      plantsService.findAll.mockResolvedValue(mockPlants as any);

      const result = await controller.findAll(mockRequest);

      expect(plantsService.findAll).toHaveBeenCalledWith(mockUserId, undefined);
      expect(result).toEqual(mockPlants);
    });

    it('should filter plants by status', async () => {
      const mockRequest = { user: { id: mockUserId } };
      const mockPlants = [mockPlant];
      plantsService.findAll.mockResolvedValue(mockPlants as any);

      const result = await controller.findAll(mockRequest, PlantStatus.ACTIVE);

      expect(plantsService.findAll).toHaveBeenCalledWith(mockUserId, {
        status: PlantStatus.ACTIVE,
      });
      expect(result).toEqual(mockPlants);
    });
  });

  describe('findOne', () => {
    it('should return a plant from the request (set by guard)', async () => {
      const mockRequest = { plant: mockPlant };

      const result = await controller.findOne(mockRequest as any);

      expect(result).toEqual(mockPlant);
    });
  });

  describe('update', () => {
    const updatePlantDto = {
      name: 'Updated Monstera',
    };

    it('should update a plant', async () => {
      const mockRequest = {
        user: { id: mockUserId },
        plant: mockPlant,
      };
      const updatedPlant = { ...mockPlant, ...updatePlantDto };
      plantsService.update.mockResolvedValue(updatedPlant as any);

      const result = await controller.update(mockRequest as any, updatePlantDto);

      expect(plantsService.update).toHaveBeenCalledWith(
        mockPlant,
        updatePlantDto,
      );
      expect(result).toEqual(updatedPlant);
    });
  });

  describe('remove', () => {
    it('should delete a plant', async () => {
      const mockRequest = { plant: mockPlant };
      const deleteResult = { deleted: true, id: mockPlantId.toString() };
      plantsService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(mockRequest as any);

      expect(plantsService.remove).toHaveBeenCalledWith(mockPlant);
      expect(result).toEqual(deleteResult);
    });
  });
});

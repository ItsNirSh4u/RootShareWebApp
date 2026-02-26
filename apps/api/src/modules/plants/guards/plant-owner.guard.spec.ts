import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { PlantOwnerGuard } from './plant-owner.guard';
import { Plant } from '../schemas/plant.schema';
import { Types } from 'mongoose';

describe('PlantOwnerGuard', () => {
  let guard: PlantOwnerGuard;
  let mockPlantModel: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockOtherUserId = new Types.ObjectId().toString();
  const mockPlantId = new Types.ObjectId().toString();

  const mockPlant = {
    _id: mockPlantId,
    userId: new Types.ObjectId(mockUserId),
    name: 'Test Plant',
    species: 'Monstera',
  };

  const createMockExecutionContext = (
    params: any,
    user: any,
  ): ExecutionContext => {
    const mockRequest = {
      params,
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    mockPlantModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantOwnerGuard,
        {
          provide: getModelToken(Plant.name),
          useValue: mockPlantModel,
        },
      ],
    }).compile();

    guard = module.get<PlantOwnerGuard>(PlantOwnerGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when user owns the plant', async () => {
      const context = createMockExecutionContext(
        { id: mockPlantId },
        { id: mockUserId },
      );

      mockPlantModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlant),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPlantModel.findById).toHaveBeenCalledWith(mockPlantId);
    });

    it('should attach plant to request when authorized', async () => {
      const mockRequest = {
        params: { id: mockPlantId },
        user: { id: mockUserId },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: (): typeof mockRequest => mockRequest,
        }),
      } as ExecutionContext;

      mockPlantModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlant),
      });

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('plant', mockPlant);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const context = createMockExecutionContext({ id: mockPlantId }, null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when plant does not exist', async () => {
      const context = createMockExecutionContext(
        { id: mockPlantId },
        { id: mockUserId },
      );

      mockPlantModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own the plant', async () => {
      const context = createMockExecutionContext(
        { id: mockPlantId },
        { id: mockOtherUserId },
      );

      mockPlantModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlant),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

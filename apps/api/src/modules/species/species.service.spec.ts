import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SpeciesService } from './species.service';
import { Species } from './schemas/species.schema';
import { SpeciesRequest } from './schemas/species-request.schema';
import { SpeciesRequestStatus } from '@rootshare/shared-types';
import { Types } from 'mongoose';

describe('SpeciesService', () => {
  let service: SpeciesService;
  let mockSpeciesModel: any;
  let mockSpeciesRequestModel: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockAdminUserId = new Types.ObjectId().toString();
  const mockSpeciesId = new Types.ObjectId();
  const mockRequestId = new Types.ObjectId();

  const mockSpecies = {
    _id: mockSpeciesId,
    name: 'Monstera',
    scientificName: 'Monstera deliciosa',
    description: 'A tropical plant',
    createdAt: new Date(),
    updatedAt: new Date(),
    deleteOne: jest.fn(),
  };

  const mockSpeciesRequest = {
    _id: mockRequestId,
    userId: new Types.ObjectId(mockUserId),
    name: 'Snake Plant',
    scientificName: 'Dracaena trifasciata',
    description: 'A succulent plant',
    reason: 'Popular houseplant that many users would benefit from',
    status: SpeciesRequestStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const mockSpeciesModelConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockSpecies, ...data }),
    }));

    mockSpeciesModel = Object.assign(mockSpeciesModelConstructor, {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
    });

    const mockSpeciesRequestModelConstructor = jest
      .fn()
      .mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({ ...mockSpeciesRequest, ...data }),
      }));

    mockSpeciesRequestModel = Object.assign(mockSpeciesRequestModelConstructor, {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpeciesService,
        {
          provide: getModelToken(Species.name),
          useValue: mockSpeciesModel,
        },
        {
          provide: getModelToken(SpeciesRequest.name),
          useValue: mockSpeciesRequestModel,
        },
      ],
    }).compile();

    service = module.get<SpeciesService>(SpeciesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========== Species Tests ==========

  describe('createSpecies', () => {
    const createSpeciesDto = {
      name: 'New Species',
      scientificName: 'Scientificus newus',
    };

    it('should create a new species', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.createSpecies(createSpeciesDto);

      expect(result).toHaveProperty('name', createSpeciesDto.name);
    });

    it('should throw ConflictException if species already exists', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpecies),
      });

      await expect(service.createSpecies(createSpeciesDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllSpecies', () => {
    it('should return all species sorted by name', async () => {
      const mockSpeciesList = [mockSpecies];
      mockSpeciesModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSpeciesList),
        }),
      });

      const result = await service.findAllSpecies();

      expect(mockSpeciesModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockSpeciesList);
    });
  });

  describe('findSpeciesById', () => {
    it('should return a species by id', async () => {
      mockSpeciesModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpecies),
      });

      const result = await service.findSpeciesById(mockSpeciesId.toString());

      expect(result).toEqual(mockSpecies);
    });

    it('should throw NotFoundException if species not found', async () => {
      mockSpeciesModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findSpeciesById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('speciesExists', () => {
    it('should return true if species exists', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpecies),
      });

      const result = await service.speciesExists('Monstera');

      expect(result).toBe(true);
    });

    it('should return false if species does not exist', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.speciesExists('Unknown');

      expect(result).toBe(false);
    });
  });

  describe('deleteSpecies', () => {
    it('should delete a species', async () => {
      mockSpeciesModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpecies),
      });

      const result = await service.deleteSpecies(mockSpeciesId.toString());

      expect(mockSpecies.deleteOne).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: true,
        id: mockSpeciesId.toString(),
      });
    });
  });

  // ========== Species Request Tests ==========

  describe('createSpeciesRequest', () => {
    const createRequestDto = {
      name: 'New Plant',
      reason: 'This is a popular plant that many users want',
    };

    it('should create a new species request', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockSpeciesRequestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.createSpeciesRequest(
        mockUserId,
        createRequestDto,
      );

      expect(result).toHaveProperty('name', createRequestDto.name);
    });

    it('should throw ConflictException if species already exists', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpecies),
      });

      await expect(
        service.createSpeciesRequest(mockUserId, createRequestDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if pending request already exists', async () => {
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockSpeciesRequestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSpeciesRequest),
      });

      await expect(
        service.createSpeciesRequest(mockUserId, createRequestDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllSpeciesRequests', () => {
    it('should return all species requests', async () => {
      const mockRequests = [mockSpeciesRequest];
      mockSpeciesRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRequests),
        }),
      });

      const result = await service.findAllSpeciesRequests();

      expect(result).toEqual(mockRequests);
    });

    it('should filter by status', async () => {
      const mockRequests = [mockSpeciesRequest];
      mockSpeciesRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRequests),
        }),
      });

      await service.findAllSpeciesRequests(SpeciesRequestStatus.PENDING);

      expect(mockSpeciesRequestModel.find).toHaveBeenCalledWith({
        status: SpeciesRequestStatus.PENDING,
      });
    });
  });

  describe('reviewSpeciesRequest', () => {
    it('should approve a species request and create the species', async () => {
      const pendingRequest = {
        ...mockSpeciesRequest,
        status: SpeciesRequestStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          ...mockSpeciesRequest,
          status: SpeciesRequestStatus.APPROVED,
        }),
      };

      mockSpeciesRequestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(pendingRequest),
      });
      mockSpeciesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const reviewDto = {
        status: SpeciesRequestStatus.APPROVED as const,
      };

      await service.reviewSpeciesRequest(
        mockRequestId.toString(),
        mockAdminUserId,
        reviewDto,
      );

      expect(pendingRequest.save).toHaveBeenCalled();
      expect(pendingRequest.status).toBe(SpeciesRequestStatus.APPROVED);
    });

    it('should reject a species request with reason', async () => {
      const pendingRequest: any = {
        ...mockSpeciesRequest,
        status: SpeciesRequestStatus.PENDING,
        rejectionReason: undefined,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      mockSpeciesRequestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(pendingRequest),
      });

      const reviewDto = {
        status: SpeciesRequestStatus.REJECTED as const,
        rejectionReason: 'Already exists under different name',
      };

      await service.reviewSpeciesRequest(
        mockRequestId.toString(),
        mockAdminUserId,
        reviewDto,
      );

      expect(pendingRequest.save).toHaveBeenCalled();
      expect(pendingRequest.rejectionReason).toBe(reviewDto.rejectionReason);
    });

    it('should throw BadRequestException if request already reviewed', async () => {
      const reviewedRequest = {
        ...mockSpeciesRequest,
        status: SpeciesRequestStatus.APPROVED,
      };

      mockSpeciesRequestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(reviewedRequest),
      });

      const reviewDto = {
        status: SpeciesRequestStatus.APPROVED as const,
      };

      await expect(
        service.reviewSpeciesRequest(
          mockRequestId.toString(),
          mockAdminUserId,
          reviewDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rejecting without reason', async () => {
      const pendingRequest = {
        ...mockSpeciesRequest,
        status: SpeciesRequestStatus.PENDING,
      };

      mockSpeciesRequestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(pendingRequest),
      });

      const reviewDto = {
        status: SpeciesRequestStatus.REJECTED as const,
      };

      await expect(
        service.reviewSpeciesRequest(
          mockRequestId.toString(),
          mockAdminUserId,
          reviewDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

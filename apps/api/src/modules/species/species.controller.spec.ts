import { Test, TestingModule } from '@nestjs/testing';
import { SpeciesController } from './species.controller';
import { SpeciesService } from './species.service';
import { SpeciesRequestStatus } from '@rootshare/shared-types';
import { Types } from 'mongoose';

describe('SpeciesController', () => {
  let controller: SpeciesController;
  let speciesService: jest.Mocked<SpeciesService>;

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
  };

  const mockSpeciesRequest = {
    _id: mockRequestId,
    userId: new Types.ObjectId(mockUserId),
    name: 'Snake Plant',
    reason: 'Popular houseplant',
    status: SpeciesRequestStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeciesController],
      providers: [
        {
          provide: SpeciesService,
          useValue: {
            createSpecies: jest.fn(),
            findAllSpecies: jest.fn(),
            findSpeciesById: jest.fn(),
            deleteSpecies: jest.fn(),
            createSpeciesRequest: jest.fn(),
            findAllSpeciesRequests: jest.fn(),
            findSpeciesRequestById: jest.fn(),
            findUserSpeciesRequests: jest.fn(),
            reviewSpeciesRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SpeciesController>(SpeciesController);
    speciesService = module.get(SpeciesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllSpecies', () => {
    it('should return all species', async () => {
      const mockSpeciesList = [mockSpecies];
      speciesService.findAllSpecies.mockResolvedValue(mockSpeciesList as any);

      const result = await controller.findAllSpecies();

      expect(speciesService.findAllSpecies).toHaveBeenCalled();
      expect(result).toEqual(mockSpeciesList);
    });
  });

  describe('findOneSpecies', () => {
    it('should return a species by id', async () => {
      speciesService.findSpeciesById.mockResolvedValue(mockSpecies as any);

      const result = await controller.findOneSpecies(mockSpeciesId.toString());

      expect(speciesService.findSpeciesById).toHaveBeenCalledWith(
        mockSpeciesId.toString(),
      );
      expect(result).toEqual(mockSpecies);
    });
  });

  describe('createSpeciesRequest', () => {
    const createRequestDto = {
      name: 'Snake Plant',
      reason: 'Popular houseplant',
    };

    it('should create a species request', async () => {
      const mockRequest = { user: { id: mockUserId } };
      speciesService.createSpeciesRequest.mockResolvedValue(
        mockSpeciesRequest as any,
      );

      const result = await controller.createSpeciesRequest(
        mockRequest,
        createRequestDto,
      );

      expect(speciesService.createSpeciesRequest).toHaveBeenCalledWith(
        mockUserId,
        createRequestDto,
      );
      expect(result).toEqual(mockSpeciesRequest);
    });
  });

  describe('findMySpeciesRequests', () => {
    it('should return user species requests', async () => {
      const mockRequest = { user: { id: mockUserId } };
      const mockRequests = [mockSpeciesRequest];
      speciesService.findUserSpeciesRequests.mockResolvedValue(
        mockRequests as any,
      );

      const result = await controller.findMySpeciesRequests(mockRequest);

      expect(speciesService.findUserSpeciesRequests).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual(mockRequests);
    });
  });

  describe('createSpecies', () => {
    const createSpeciesDto = {
      name: 'New Species',
      scientificName: 'Scientificus newus',
    };

    it('should create a species (admin)', async () => {
      speciesService.createSpecies.mockResolvedValue(mockSpecies as any);

      const result = await controller.createSpecies(createSpeciesDto);

      expect(speciesService.createSpecies).toHaveBeenCalledWith(
        createSpeciesDto,
      );
      expect(result).toEqual(mockSpecies);
    });
  });

  describe('deleteSpecies', () => {
    it('should delete a species (admin)', async () => {
      const deleteResult = { deleted: true, id: mockSpeciesId.toString() };
      speciesService.deleteSpecies.mockResolvedValue(deleteResult);

      const result = await controller.deleteSpecies(mockSpeciesId.toString());

      expect(speciesService.deleteSpecies).toHaveBeenCalledWith(
        mockSpeciesId.toString(),
      );
      expect(result).toEqual(deleteResult);
    });
  });

  describe('findAllSpeciesRequests', () => {
    it('should return all species requests (admin)', async () => {
      const mockRequests = [mockSpeciesRequest];
      speciesService.findAllSpeciesRequests.mockResolvedValue(
        mockRequests as any,
      );

      const result = await controller.findAllSpeciesRequests();

      expect(speciesService.findAllSpeciesRequests).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toEqual(mockRequests);
    });

    it('should filter by status (admin)', async () => {
      const mockRequests = [mockSpeciesRequest];
      speciesService.findAllSpeciesRequests.mockResolvedValue(
        mockRequests as any,
      );

      const result = await controller.findAllSpeciesRequests(
        SpeciesRequestStatus.PENDING,
      );

      expect(speciesService.findAllSpeciesRequests).toHaveBeenCalledWith(
        SpeciesRequestStatus.PENDING,
      );
      expect(result).toEqual(mockRequests);
    });
  });

  describe('reviewSpeciesRequest', () => {
    const reviewDto = {
      status: SpeciesRequestStatus.APPROVED as const,
    };

    it('should review a species request (admin)', async () => {
      const mockRequest = { user: { id: mockAdminUserId } };
      const reviewedRequest = {
        ...mockSpeciesRequest,
        status: SpeciesRequestStatus.APPROVED,
      };
      speciesService.reviewSpeciesRequest.mockResolvedValue(
        reviewedRequest as any,
      );

      const result = await controller.reviewSpeciesRequest(
        mockRequestId.toString(),
        mockRequest,
        reviewDto,
      );

      expect(speciesService.reviewSpeciesRequest).toHaveBeenCalledWith(
        mockRequestId.toString(),
        mockAdminUserId,
        reviewDto,
      );
      expect(result).toEqual(reviewedRequest);
    });
  });
});

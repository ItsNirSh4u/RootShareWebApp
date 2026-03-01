import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { PostOwnerGuard } from './post-owner.guard';
import { Post } from '../schemas/post.schema';
import { Types } from 'mongoose';

describe('PostOwnerGuard', () => {
  let guard: PostOwnerGuard;
  let mockPostModel: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockOtherUserId = new Types.ObjectId().toString();
  const mockPostId = new Types.ObjectId().toString();

  const mockPost = {
    _id: mockPostId,
    userId: new Types.ObjectId(mockUserId),
    content: 'Test content',
  };

  const createMockExecutionContext = (params: any, user: any): ExecutionContext => {
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
    mockPostModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostOwnerGuard,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    guard = module.get<PostOwnerGuard>(PostOwnerGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when user owns the post', async () => {
      const context = createMockExecutionContext(
        { id: mockPostId },
        { id: mockUserId },
      );

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPostModel.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should attach post to request when authorized', async () => {
      const mockRequest = {
        params: { id: mockPostId },
        user: { id: mockUserId },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: (): typeof mockRequest => mockRequest,
        }),
      } as ExecutionContext;

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('post', mockPost);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const context = createMockExecutionContext(
        { id: mockPostId },
        null,
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      const context = createMockExecutionContext(
        { id: mockPostId },
        { id: mockUserId },
      );

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the post', async () => {
      const context = createMockExecutionContext(
        { id: mockPostId },
        { id: mockOtherUserId },
      );

      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import { PostType } from '@rootshare/shared-types';
import { Types } from 'mongoose';

describe('PostsService', () => {
  let service: PostsService;
  let mockPostModel: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockPostId = new Types.ObjectId();

  const mockPost = {
    _id: mockPostId,
    userId: new Types.ObjectId(mockUserId),
    type: PostType.UPDATE,
    content: 'Test post content',
    images: [],
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const mockPostModelConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockPost, ...data }),
    }));

    mockPostModel = Object.assign(mockPostModelConstructor, {
      find: jest.fn(),
      findById: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPostDto = {
      type: PostType.UPDATE,
      content: 'New post content',
      images: ['https://example.com/image.jpg'],
    };

    it('should create a new post', async () => {
      const result = await service.create(mockUserId, createPostDto);

      expect(mockPostModel).toHaveBeenCalledWith({
        ...createPostDto,
        userId: expect.any(Types.ObjectId),
      });
      expect(result).toHaveProperty('content', createPostDto.content);
    });
  });

  describe('findAll', () => {
    it('should return all posts sorted by createdAt desc', async () => {
      const mockPosts = [mockPost, { ...mockPost, _id: new Types.ObjectId() }];
      mockPostModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPosts),
        }),
      });

      const result = await service.findAll();

      expect(mockPostModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockPosts);
    });
  });

  describe('findOne', () => {
    it('should return a post by id', async () => {
      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      const result = await service.findOne(mockPostId.toString());

      expect(mockPostModel.findById).toHaveBeenCalledWith(mockPostId.toString());
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updatePostDto = {
      content: 'Updated content',
    };

    it('should update a post', async () => {
      const postDocument = {
        ...mockPost,
        save: jest.fn().mockResolvedValue({ ...mockPost, ...updatePostDto }),
      };

      const result = await service.update(postDocument as any, updatePostDto);

      expect(postDocument.save).toHaveBeenCalled();
      expect(result.content).toBe(updatePostDto.content);
    });
  });

  describe('remove', () => {
    it('should delete a post and return confirmation', async () => {
      const postDocument = {
        ...mockPost,
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };

      const result = await service.remove(postDocument as any);

      expect(postDocument.deleteOne).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: true,
        id: mockPostId.toString(),
      });
    });
  });
});

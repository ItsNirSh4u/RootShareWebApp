import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { Post } from './schemas/post.schema';
import { PostType } from '@rootshare/shared-types';
import { Types } from 'mongoose';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: jest.Mocked<PostsService>;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getModelToken(Post.name),
          useValue: {},
        },
        PostOwnerGuard,
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPostDto = {
      type: PostType.UPDATE,
      content: 'New post content',
    };

    it('should create a new post', async () => {
      const mockRequest = { user: { id: mockUserId } };
      postsService.create.mockResolvedValue(mockPost as any);

      const result = await controller.create(mockRequest, createPostDto);

      expect(postsService.create).toHaveBeenCalledWith(mockUserId, createPostDto);
      expect(result).toEqual(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return all posts', async () => {
      const mockPosts = [mockPost, { ...mockPost, _id: new Types.ObjectId() }];
      postsService.findAll.mockResolvedValue(mockPosts as any);

      const result = await controller.findAll({ user: { id: mockUserId } });

      expect(postsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPosts);
    });
  });

  describe('findOne', () => {
    it('should return a single post', async () => {
      postsService.findOne.mockResolvedValue(mockPost as any);

      const result = await controller.findOne(mockPostId.toString());

      expect(postsService.findOne).toHaveBeenCalledWith(mockPostId.toString());
      expect(result).toEqual(mockPost);
    });
  });

  describe('update', () => {
    const updatePostDto = {
      content: 'Updated content',
    };

    it('should update a post', async () => {
      const mockRequest = {
        user: { id: mockUserId },
        post: mockPost,
      };
      const updatedPost = { ...mockPost, ...updatePostDto };
      postsService.update.mockResolvedValue(updatedPost as any);

      const result = await controller.update(mockRequest as any, updatePostDto);

      expect(postsService.update).toHaveBeenCalledWith(mockPost, updatePostDto);
      expect(result).toEqual(updatedPost);
    });
  });

  describe('remove', () => {
    it('should delete a post', async () => {
      const mockRequest = { post: mockPost };
      const deleteResult = { deleted: true, id: mockPostId.toString() };
      postsService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(mockRequest as any);

      expect(postsService.remove).toHaveBeenCalledWith(mockPost);
      expect(result).toEqual(deleteResult);
    });
  });
});

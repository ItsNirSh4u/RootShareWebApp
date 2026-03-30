import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCache } from './schemas/ai-cache.schema';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
    },
  })),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-image-data')),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));

describe('AiService', () => {
  let service: AiService;
  let mockCacheModel: { findOne: jest.Mock; create: jest.Mock };
  let mockModels: { generateContent: jest.Mock; generateContentStream: jest.Mock };

  beforeEach(async () => {
    mockCacheModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: getModelToken(AiCache.name), useValue: mockCacheModel },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-api-key') } },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    mockModels = (service as any).genai.models;
  });

  afterEach(() => jest.clearAllMocks());

  describe('checkRateLimit', () => {
    it('allows requests within the limit', () => {
      expect(() => service.checkRateLimit('user-ok')).not.toThrow();
    });

    it('throws after exceeding rate limit', () => {
      const userId = 'user-limited';
      for (let i = 0; i < 20; i++) service.checkRateLimit(userId);
      expect(() => service.checkRateLimit(userId)).toThrow(HttpException);
    });

    it('resets after window expires', () => {
      const userId = 'user-reset';
      (service as any).rateLimits.set(userId, { count: 20, resetAt: Date.now() - 1 });
      expect(() => service.checkRateLimit(userId)).not.toThrow();
    });
  });

  describe('identifyPlant', () => {
    it('returns cached result without calling Gemini', async () => {
      mockCacheModel.findOne.mockResolvedValue({ response: 'Cached plant info' });

      const result = await service.identifyPlant('/uploads/ai-images/test.jpg');

      expect(result).toBe('Cached plant info');
      expect(mockModels.generateContent).not.toHaveBeenCalled();
    });

    it('calls Gemini and caches result on cache miss', async () => {
      mockCacheModel.findOne.mockResolvedValue(null);
      mockCacheModel.create.mockResolvedValue({});
      mockModels.generateContent.mockResolvedValue({ text: 'Rose - Rosa canina' });

      const result = await service.identifyPlant('/uploads/ai-images/test.jpg');

      expect(result).toBe('Rose - Rosa canina');
      expect(mockCacheModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ response: 'Rose - Rosa canina' }),
      );
    });
  });

  describe('getPlantInfo', () => {
    it('returns cached result without calling Gemini', async () => {
      mockCacheModel.findOne.mockResolvedValue({ response: 'Cached info' });

      const result = await service.getPlantInfo('rose');

      expect(result).toBe('Cached info');
      expect(mockModels.generateContent).not.toHaveBeenCalled();
    });

    it('calls Gemini and caches result on cache miss', async () => {
      mockCacheModel.findOne.mockResolvedValue(null);
      mockCacheModel.create.mockResolvedValue({});
      mockModels.generateContent.mockResolvedValue({ text: 'Rose origin and care' });

      const result = await service.getPlantInfo('rose');

      expect(result).toBe('Rose origin and care');
      expect(mockCacheModel.create).toHaveBeenCalled();
    });

    it('normalises plant name for cache key (same key for "Rose" and "rose")', async () => {
      mockCacheModel.findOne.mockResolvedValue({ response: 'info' });

      await service.getPlantInfo('Rose');
      await service.getPlantInfo('rose');

      const [call1, call2] = mockCacheModel.findOne.mock.calls;
      expect(call1[0]).toEqual(call2[0]);
    });
  });

  describe('streamChat', () => {
    it('yields text chunks from the Gemini stream', async () => {
      async function* mockStream() {
        yield { text: 'Hello ' };
        yield { text: 'world' };
        yield { text: undefined };
      }
      mockModels.generateContentStream.mockResolvedValue(mockStream());

      const chunks: string[] = [];
      for await (const chunk of service.streamChat('hi', [])) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'world']);
    });

    it('includes image data in request when imagePath provided', async () => {
      async function* mockStream() { yield { text: 'ok' }; }
      mockModels.generateContentStream.mockResolvedValue(mockStream());

      for await (const _ of service.streamChat('describe this', [], '/uploads/test.jpg')) { /* drain */ }

      const callArgs = mockModels.generateContentStream.mock.calls[0][0];
      const userParts = callArgs.contents.at(-1).parts;
      expect(userParts.some((p: any) => p.inlineData)).toBe(true);
    });
  });
});

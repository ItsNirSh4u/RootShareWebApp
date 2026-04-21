import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';
import { AiCache, AiCacheDocument } from './schemas/ai-cache.schema';
import { PLANT_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, INFO_SYSTEM_PROMPT } from './ai-prompts';
import { ChatMessageDto } from './dto/ai-chat.dto';

const GEMINI_MODEL = 'gemini-2.5-flash';
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

@Injectable()
export class AiService {
  private readonly genai: GoogleGenAI;
  private readonly model: string;
  private readonly rateLimits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    @InjectModel(AiCache.name) private readonly cacheModel: Model<AiCacheDocument>,
    private readonly configService: ConfigService,
  ) {
    this.genai = new GoogleGenAI({});
    this.model = this.configService.get<string>('GEMINI_MODEL')!;
  }

  checkRateLimit(userId: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(userId);
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
      throw new HttpException('AI rate limit exceeded. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    entry.count++;
  }

  async identifyPlant(imagePath: string): Promise<string> {
    const buffer = readFileSync(imagePath);
    const key = createHash('sha256').update(buffer).digest('hex');

    const cached = await this.cacheModel.findOne({ key });
    if (cached) return cached.response;

    const response = await this.genai.models.generateContent({
      model: this.model,
      config: { systemInstruction: PLANT_SYSTEM_PROMPT },
      contents: [
        {
          parts: [
            { text: 'Identify this plant. Provide: common name, scientific name, health assessment, and care tips.' },
            { inlineData: { mimeType: this.getMimeType(imagePath), data: buffer.toString('base64') } },
          ],
        },
      ],
    });

    const result = response.text ?? '';
    await this.cacheModel.create({ key, response: result });
    return result;
  }

  async *streamChat(
    message: string,
    history: ChatMessageDto[],
    imagePath?: string,
  ): AsyncGenerator<string> {
    const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: message }];

    if (imagePath) {
      const uploadsDir = path.resolve(process.env.UPLOAD_PATH || './uploads');
      const resolved = path.resolve(imagePath);
      if (!resolved.startsWith(uploadsDir)) {
        throw new HttpException('Invalid image path', HttpStatus.BAD_REQUEST);
      }
      const buffer = readFileSync(resolved);
      userParts.push({ inlineData: { mimeType: this.getMimeType(resolved), data: buffer.toString('base64') } });
    }

    const contents = [
      ...history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      { role: 'user' as const, parts: userParts },
    ];

    const stream = await this.genai.models.generateContentStream({
      model: this.model,
      config: { systemInstruction: CHAT_SYSTEM_PROMPT },
      contents,
    });

    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  }

  async getPlantInfo(plantName: string): Promise<string> {
    const key = createHash('sha256').update(plantName.toLowerCase().trim()).digest('hex');

    const cached = await this.cacheModel.findOne({ key });
    if (cached) return cached.response;

    const response = await this.genai.models.generateContent({
      model: this.model,
      config: { systemInstruction: INFO_SYSTEM_PROMPT },
      contents: `Tell me about the plant: ${plantName}`,
    });

    const result = response.text ?? '';
    await this.cacheModel.create({ key, response: result });
    return result;
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const types: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    };
    return types[ext] ?? 'image/jpeg';
  }
}

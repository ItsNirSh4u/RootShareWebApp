import {
  Controller, Post, Get, Param, Body, Req, Res,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { IRequest } from '@/common/interfaces/request.interface';

const getAiImagesDir = (): string => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const dir = path.join(uploadPath, 'ai-images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const aiImageStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, getAiImagesDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `ai-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
};

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('identify')
  @ApiOperation({ summary: 'Identify a plant from an uploaded image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Plant identification result' })
  @ApiResponse({ status: 400, description: 'No image provided' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: aiImageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async identifyPlant(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: IRequest,
  ): Promise<{ result: string }> {
    if (!file) throw new BadRequestException('Image file is required');
    this.aiService.checkRateLimit(req.user.id);
    try {
      const result = await this.aiService.identifyPlant(file.path);
      return { result };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(`Plant identification failed: ${message}`);
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Stream a plant-care chat response' })
  @ApiBody({ type: AiChatDto })
  @ApiResponse({ status: 200, description: 'Streamed plain-text response' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async chat(
    @Body() dto: AiChatDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.aiService.checkRateLimit(req.user.id);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    try {
      for await (const chunk of this.aiService.streamChat(dto.message, dto.history ?? [], dto.imagePath)) {
        res.write(chunk);
      }
    } finally {
      res.end();
    }
  }

  @Get('info/:plantName')
  @ApiOperation({ summary: 'Get plant origin, name meaning, and care tips' })
  @ApiParam({ name: 'plantName', description: 'Plant common or scientific name' })
  @ApiResponse({ status: 200, description: 'Plant information' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async getPlantInfo(
    @Param('plantName') plantName: string,
    @Req() req: IRequest,
  ): Promise<{ result: string }> {
    this.aiService.checkRateLimit(req.user.id);
    const result = await this.aiService.getPlantInfo(plantName);
    return { result };
  }
}

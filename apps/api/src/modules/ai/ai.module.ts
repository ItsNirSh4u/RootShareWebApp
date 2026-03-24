import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiCache, AiCacheSchema } from './schemas/ai-cache.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: AiCache.name, schema: AiCacheSchema }])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}

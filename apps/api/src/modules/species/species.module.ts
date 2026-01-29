import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpeciesService } from './species.service';
import { SpeciesController } from './species.controller';
import { Species, SpeciesSchema } from './schemas/species.schema';
import {
  SpeciesRequest,
  SpeciesRequestSchema,
} from './schemas/species-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Species.name, schema: SpeciesSchema },
      { name: SpeciesRequest.name, schema: SpeciesRequestSchema },
    ]),
  ],
  controllers: [SpeciesController],
  providers: [SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}

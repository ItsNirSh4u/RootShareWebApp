import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlantsService } from './plants.service';
import { PlantsController } from './plants.controller';
import { Plant, PlantSchema } from './schemas/plant.schema';
import { PlantOwnerGuard } from './guards/plant-owner.guard';
import { SpeciesModule } from '../species/species.module';
import { Post, PostSchema } from '../posts/schemas/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plant.name, schema: PlantSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    SpeciesModule,
  ],
  controllers: [PlantsController],
  providers: [PlantsService, PlantOwnerGuard],
  exports: [PlantsService],
})
export class PlantsModule {}

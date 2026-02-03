import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { PostOwnerGuard } from './guards/post-owner.guard';
import { PlantsModule } from '../plants/plants.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    PlantsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostOwnerGuard],
  exports: [PostsService],
})
export class PostsModule {}

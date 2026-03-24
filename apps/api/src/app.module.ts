import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlantsModule } from './modules/plants/plants.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { SpeciesModule } from './modules/species/species.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const axiomDataset = configService.get<string>('AXIOM_DATASET');
        const axiomToken = configService.get<string>('AXIOM_TOKEN');

        const targets: any[] = [];

        if (isProduction && axiomDataset && axiomToken) {
          targets.push({
            target: '@axiomhq/pino',
            options: {
              dataset: axiomDataset,
              token: axiomToken,
            },
          });
        }

        targets.push({
          target: isProduction ? 'pino/file' : 'pino-pretty',
          options: isProduction ? {} : { colorize: true },
        });

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: { targets },
            autoLogging: {
              ignore: (req: any): boolean => req.url === '/api/health',
            },
          },
        };
      },
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    AuthModule,
    UsersModule,
    PlantsModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    SpeciesModule,
    ChatModule,
    AiModule,
  ],
})
export class AppModule {}

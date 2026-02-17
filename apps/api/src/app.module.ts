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

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Structured logging with Pino
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

        // Always log to stdout (pretty in dev, JSON in prod)
        targets.push({
          target: isProduction ? 'pino/file' : 'pino-pretty',
          options: isProduction ? {} : { colorize: true },
        });

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: { targets },
            autoLogging: {
              ignore: (req: any) => req.url === '/api/health',
            },
          },
        };
      },
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    PlantsModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    SpeciesModule,
    ChatModule,
  ],
})
export class AppModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { PostsModule } from '../../src/modules/posts/posts.module';
import { CommentsModule } from '../../src/modules/comments/comments.module';
import { LikesModule } from '../../src/modules/likes/likes.module';
import request from 'supertest';

export class AppTester {
  private app: INestApplication;
  private mongoServer: MongoMemoryServer;
  private moduleFixture: TestingModule;

  async setup(): Promise<this> {
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();

    this.moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              MONGODB_URI: mongoUri,
              JWT_ACCESS_SECRET: 'test-access-secret',
              JWT_REFRESH_SECRET: 'test-refresh-secret',
              JWT_ACCESS_EXPIRATION: '15m',
              JWT_REFRESH_EXPIRATION: '7d',
              GOOGLE_CLIENT_ID: 'test-google-client-id',
              GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
              GOOGLE_CALLBACK_URL:
                'http://localhost:3000/api/auth/google/callback',
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        AuthModule,
        UsersModule,
        PostsModule,
        CommentsModule,
        LikesModule,
      ],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    this.app.setGlobalPrefix('api');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await this.app.init();

    return this;
  }

  getApp(): INestApplication {
    return this.app;
  }

  async login(): Promise<{ accessToken: string; refreshToken: string }> {
    const user = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
    };

    await request(this.app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200);

    return response.body.tokens;
  }

  async tearDown(): Promise<void> {
    await this.app.close();
    await this.mongoServer.stop();
  }
}

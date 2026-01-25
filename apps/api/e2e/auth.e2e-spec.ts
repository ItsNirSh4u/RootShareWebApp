import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123!',
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
              GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Regular Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(testUser)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.username).toBe(testUser.username);
        expect(response.body.tokens).toHaveProperty('accessToken');
        expect(response.body.tokens).toHaveProperty('refreshToken');
        expect(response.body.user).not.toHaveProperty('password');
      });

      it('should return 409 when email already exists', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(testUser)
          .expect(409);

        expect(response.body.message).toContain('already exists');
      });

      it('should return 400 for invalid registration data', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            username: 'ab',
            password: 'weak',
          })
          .expect(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.tokens).toHaveProperty('accessToken');
        expect(response.body.tokens).toHaveProperty('refreshToken');
      });

      it('should return 401 for invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);
      });

      it('should return 401 for non-existent user', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Password123!',
          })
          .expect(401);
      });
    });

    describe('GET /api/auth/me', () => {
      let accessToken: string;

      beforeAll(async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          });
        accessToken = loginResponse.body.tokens.accessToken;
      });

      it('should return current user with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.email).toBe(testUser.email);
      });

      it('should return 401 without token', async () => {
        await request(app.getHttpServer()).get('/api/auth/me').expect(401);
      });

      it('should return 401 with invalid token', async () => {
        await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully with valid token', async () => {
        const loginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          });

        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${loginResponse.body.tokens.accessToken}`)
          .expect(201);
      });

      it('should return 401 without token', async () => {
        await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
      });
    });
  });

  describe('Google OAuth', () => {
    describe('GET /api/auth/google', () => {
      it('should redirect to Google OAuth', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/auth/google')
          .expect(302);

        expect(response.headers.location).toContain('accounts.google.com');
      });
    });

    describe('POST /api/auth/google/token', () => {
      it('should return 401 for invalid Google ID token', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/google/token')
          .send({ idToken: 'invalid-google-id-token' })
          .expect(401);
      });
    });
  });
});

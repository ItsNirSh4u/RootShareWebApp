import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Model } from 'mongoose';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { SpeciesModule } from '../src/modules/species/species.module';
import { User, UserDocument } from '../src/modules/users/schemas/user.schema';
import { SpeciesRequestStatus, UserRole } from '@rootshare/shared-types';

describe('Species (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let userModel: Model<UserDocument>;
  let userAccessToken: string;
  let adminAccessToken: string;

  const testUser = {
    email: 'speciesuser@example.com',
    username: 'speciesuser',
    password: 'Password123!',
  };

  const adminUser = {
    email: 'admin@example.com',
    username: 'adminuser',
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
        SpeciesModule,
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

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));

    // Register regular user
    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);
    userAccessToken = userResponse.body.tokens.accessToken;

    // Register and upgrade admin user
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminUser);
    adminAccessToken = adminResponse.body.tokens.accessToken;

    // Update user to admin role
    await userModel.updateOne(
      { email: adminUser.email },
      { role: UserRole.ADMIN },
    );

    // Re-login admin to get updated token with admin role
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });
    adminAccessToken = adminLoginResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  // ========== Public Endpoints ==========

  describe('GET /api/species', () => {
    it('should return all species (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/species')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ========== Admin Species Management ==========

  describe('POST /api/species/admin', () => {
    it('should create a species (admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/species/admin')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Pothos',
          scientificName: 'Epipremnum aureum',
          description: 'A popular trailing plant',
        })
        .expect(201);

      expect(response.body.name).toBe('Pothos');
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .post('/api/species/admin')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: 'Unauthorized Species',
        })
        .expect(403);
    });

    it('should return 409 for duplicate species', async () => {
      await request(app.getHttpServer())
        .post('/api/species/admin')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Pothos',
        })
        .expect(409);
    });
  });

  describe('GET /api/species/:id', () => {
    let speciesId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/species/admin')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Spider Plant',
          scientificName: 'Chlorophytum comosum',
        });
      speciesId = createResponse.body._id;
    });

    it('should return a species by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/species/${speciesId}`)
        .expect(200);

      expect(response.body._id).toBe(speciesId);
      expect(response.body.name).toBe('Spider Plant');
    });

    it('should return 404 for non-existent species', async () => {
      await request(app.getHttpServer())
        .get('/api/species/000000000000000000000000')
        .expect(404);
    });
  });

  describe('DELETE /api/species/admin/:id', () => {
    let speciesId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/species/admin')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: `Delete Species ${Date.now()}`,
        });
      speciesId = createResponse.body._id;
    });

    it('should delete a species (admin)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/species/admin/${speciesId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/species/admin/${speciesId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });
  });

  // ========== Species Requests ==========

  describe('POST /api/species/requests', () => {
    it('should create a species request (user)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/species/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: 'Peace Lily',
          scientificName: 'Spathiphyllum',
          description: 'A beautiful flowering plant',
          reason: 'This is a very popular houseplant that many users would benefit from having',
        })
        .expect(201);

      expect(response.body.name).toBe('Peace Lily');
      expect(response.body.status).toBe(SpeciesRequestStatus.PENDING);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/species/requests')
        .send({
          name: 'Test Species',
          reason: 'Test reason for species request',
        })
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/species/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: '',
          reason: 'short',
        })
        .expect(400);
    });

    it('should return 409 for duplicate pending request', async () => {
      await request(app.getHttpServer())
        .post('/api/species/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: 'Peace Lily',
          reason: 'Another reason for the same species',
        })
        .expect(409);
    });
  });

  describe('GET /api/species/requests/my', () => {
    it('should return user species requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/species/requests/my')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/species/requests/my')
        .expect(401);
    });
  });

  // ========== Admin Request Management ==========

  describe('GET /api/species/admin/requests', () => {
    it('should return all requests (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/species/admin/requests')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by status (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/species/admin/requests?status=pending')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((req: any) => {
        expect(req.status).toBe(SpeciesRequestStatus.PENDING);
      });
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/species/admin/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/species/admin/requests/:id/review', () => {
    let requestId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/species/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: `Review Test ${Date.now()}`,
          reason: 'This is a test request for review',
        });
      requestId = createResponse.body._id;
    });

    it('should approve a request and create species (admin)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/species/admin/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: SpeciesRequestStatus.APPROVED,
        })
        .expect(201);

      expect(response.body.status).toBe(SpeciesRequestStatus.APPROVED);
      expect(response.body.reviewedBy).toBeDefined();
      expect(response.body.reviewedAt).toBeDefined();
    });

    it('should reject a request with reason (admin)', async () => {
      // Create a new request for this test
      const newRequest = await request(app.getHttpServer())
        .post('/api/species/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: `Reject Test ${Date.now()}`,
          reason: 'This is a test request for rejection',
        });

      const response = await request(app.getHttpServer())
        .post(`/api/species/admin/requests/${newRequest.body._id}/review`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: SpeciesRequestStatus.REJECTED,
          rejectionReason: 'This species already exists under a different name',
        })
        .expect(201);

      expect(response.body.status).toBe(SpeciesRequestStatus.REJECTED);
      expect(response.body.rejectionReason).toBe(
        'This species already exists under a different name',
      );
    });

    it('should return 400 when rejecting without reason', async () => {
      const newRequest = await request(app.getHttpServer())
        .post('/api/species/requests')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: `No Reason Test ${Date.now()}`,
          reason: 'This is a test request',
        });

      await request(app.getHttpServer())
        .post(`/api/species/admin/requests/${newRequest.body._id}/review`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: SpeciesRequestStatus.REJECTED,
        })
        .expect(400);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .post(`/api/species/admin/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          status: SpeciesRequestStatus.APPROVED,
        })
        .expect(403);
    });
  });
});

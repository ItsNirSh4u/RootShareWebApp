import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Model } from 'mongoose';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { PlantsModule } from '../src/modules/plants/plants.module';
import { SpeciesModule } from '../src/modules/species/species.module';
import { Species, SpeciesDocument } from '../src/modules/species/schemas/species.schema';
import { PlantStatus } from '@rootshare/shared-types';

describe('Plants (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let speciesModel: Model<SpeciesDocument>;
  let accessToken: string;
  let userId: string;

  const testUser = {
    email: 'plantuser@example.com',
    username: 'plantuser',
    password: 'Password123!',
  };

  const testSpecies = {
    name: 'Monstera',
    scientificName: 'Monstera deliciosa',
    description: 'A tropical plant',
  };

  const testPlant = {
    name: 'My Monstera',
    species: 'Monstera',
    imageUrl: 'https://example.com/plant.jpg',
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
        PlantsModule,
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

    speciesModel = moduleFixture.get<Model<SpeciesDocument>>(
      getModelToken(Species.name),
    );

    await speciesModel.create(testSpecies);

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.tokens.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('POST /api/plants', () => {
    it('should create a plant with valid species', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testPlant)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(testPlant.name);
      expect(response.body.species).toBe(testPlant.species);
      expect(response.body.status).toBe(PlantStatus.ACTIVE);
    });

    it('should return 400 for invalid species', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testPlant,
          species: 'Invalid Species',
        })
        .expect(400);

      expect(response.body.message).toContain('not in the approved species list');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/plants')
        .send(testPlant)
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
          species: '',
          imageUrl: 'not-a-url',
        })
        .expect(400);
    });
  });

  describe('GET /api/plants', () => {
    it('should return all plants for the user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter plants by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/plants?status=active')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((plant: any) => {
        expect(plant.status).toBe(PlantStatus.ACTIVE);
      });
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/plants').expect(401);
    });
  });

  describe('GET /api/plants/:id', () => {
    let plantId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Plant for Get',
          species: 'Monstera',
          imageUrl: 'https://example.com/test.jpg',
        });
      plantId = createResponse.body._id;
    });

    it('should return a plant by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body._id).toBe(plantId);
    });

    it('should return 404 for non-existent plant', async () => {
      await request(app.getHttpServer())
        .get('/api/plants/000000000000000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/api/plants/${plantId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/plants/:id', () => {
    let plantId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Plant for Update',
          species: 'Monstera',
          imageUrl: 'https://example.com/test.jpg',
        });
      plantId = createResponse.body._id;
    });

    it('should update a plant', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Plant Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Plant Name');
    });

    it('should update plant status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: PlantStatus.GIFTED })
        .expect(200);

      expect(response.body.status).toBe(PlantStatus.GIFTED);
    });

    it('should return 400 for invalid species update', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ species: 'Invalid Species' })
        .expect(400);

      expect(response.body.message).toContain('not in the approved species list');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .patch(`/api/plants/${plantId}`)
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/plants/:id', () => {
    let plantId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Plant for Delete',
          species: 'Monstera',
          imageUrl: 'https://example.com/test.jpg',
        });
      plantId = createResponse.body._id;
    });

    it('should delete a plant', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.deleted).toBe(true);
      expect(response.body.id).toBe(plantId);
    });

    it('should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(app.getHttpServer())
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/plants/${plantId}`)
        .expect(401);
    });
  });

  describe('Plant ownership', () => {
    let otherUserToken: string;
    let plantId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Owned Plant',
          species: 'Monstera',
          imageUrl: 'https://example.com/owned.jpg',
        });
      plantId = createResponse.body._id;

      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'otheruser@example.com',
          username: 'otheruser',
          password: 'Password123!',
        });
      otherUserToken = otherUserResponse.body.tokens.accessToken;
    });

    it('should return 403 when trying to get another user plant', async () => {
      await request(app.getHttpServer())
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should return 403 when trying to update another user plant', async () => {
      await request(app.getHttpServer())
        .patch(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('should return 403 when trying to delete another user plant', async () => {
      await request(app.getHttpServer())
        .delete(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });
});

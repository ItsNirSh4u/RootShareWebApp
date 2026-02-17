import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { MessageDocument } from '../src/modules/chat/schemas/message.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('Chat (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let messageModel: Model<MessageDocument>;

  let user1: any, user2: any;
  let token1: string, token2: string;
  let chatId: string;

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
              JWT_ACCESS_EXPIRATION: '1h',
              JWT_REFRESH_EXPIRATION: '7d',
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(0);

    messageModel = moduleFixture.get<Model<MessageDocument>>(
      getModelToken('Message'),
    );

    // Register two users
    const user1Data = { email: 'user1@test.com', username: 'user1', password: 'Password123!' };
    const user2Data = { email: 'user2@test.com', username: 'user2', password: 'Password123!' };

    const res1 = await request(app.getHttpServer()).post('/api/auth/register').send(user1Data);
    user1 = res1.body.user;
    token1 = res1.body.tokens.accessToken;

    const res2 = await request(app.getHttpServer()).post('/api/auth/register').send(user2Data);
    user2 = res2.body.user;
    token2 = res2.body.tokens.accessToken;

    // Create a chat between them
    const chatRes = await request(app.getHttpServer())
      .post('/api/chats')
      .set('Authorization', `Bearer ${token1}`)
      .send({ userId: user2._id });
    chatId = chatRes.body._id;
  });

  afterAll(async () => {
    clientSocket1?.close();
    clientSocket2?.close();
    await app.close();
    await mongoServer.stop();
  });

  it('should connect to the websocket, send and receive a message', (done) => {
    const port = app.getHttpServer().address().port;
    const url = `http://localhost:${port}`;

    clientSocket1 = io(url, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    clientSocket2 = io(url, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    const messageContent = 'Hello from user1!';

    clientSocket2.on('connect', () => {
      clientSocket2.emit('join_room', { roomId: chatId });
    });

    clientSocket2.on('message', async (message: any) => {
      try {
        expect(message.content).toBe(messageContent);
        expect(message.senderId).toBe(user1._id);

        // Verify message is in the database
        const dbMessage = await messageModel.findById(message._id);
        expect(dbMessage).not.toBeNull();
        expect(dbMessage!.content).toBe(messageContent);

        done();
      } catch (err) {
        done(err);
      }
    });

    // User1 connects and joins the room, then waits for user2 to join
    clientSocket1.on('connect', () => {
      clientSocket1.emit('join_room', { roomId: chatId });
    });

    // When user2 joins the room, user1 receives 'user_joined' — safe to send now
    clientSocket1.on('user_joined', () => {
      clientSocket1.emit('send_message', {
        chatId: chatId,
        content: messageContent,
      });
    });
  });
});

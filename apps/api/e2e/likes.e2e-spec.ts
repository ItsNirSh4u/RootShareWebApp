import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreatePostDto } from '../src/modules/posts/dto/create-post.dto';
import { PostType } from '@rootshare/shared-types';
import { CreateCommentDto } from '../src/modules/comments/dto/create-comment.dto';
import { AppTester } from './utils/app-tester';

describe('Likes (e2e)', () => {
  let app: INestApplication;
  let tester: AppTester;
  let jwtToken: string;
  let postId: string;
  let commentId: string;

  beforeAll(async () => {
    tester = await new AppTester().setup();
    app = tester.getApp();

    const loginResponse = await tester.login();
    jwtToken = loginResponse.accessToken;

    const createPostDto: CreatePostDto = {
      type: PostType.UPDATE,
      content: 'Test post for likes',
    };

    const postResponse = await request(app.getHttpServer())
      .post('/api/posts')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createPostDto)
      .expect(201);

    postId = postResponse.body._id;

    const createCommentDto: CreateCommentDto = {
      postId,
      content: 'Test comment for likes',
    };

    const commentResponse = await request(app.getHttpServer())
      .post(`/api/comments`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createCommentDto)
      .expect(201);

    commentId = commentResponse.body._id;
  });

  afterAll(async () => {
    await tester.tearDown();
  });

  describe('/api/likes', () => {
    it('should be able to like and unlike a post', async () => {
      let response = await request(app.getHttpServer())
        .post(`/api/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.liked).toBe(true);

      response = await request(app.getHttpServer())
        .post(`/api/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.liked).toBe(false);
    });

    it('should be able to like and unlike a comment', async () => {
      let response = await request(app.getHttpServer())
        .post(`/api/likes/comments/${commentId}/toggle`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.liked).toBe(true);

      response = await request(app.getHttpServer())
        .post(`/api/likes/comments/${commentId}/toggle`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.liked).toBe(false);
    });

    it('should get the number of likes for a post', async () => {
      await request(app.getHttpServer())
        .post(`/api/likes/posts/${postId}/toggle`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/likes/posts/${postId}/count`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.likes).toBe(1);
    });

    it('should get the number of likes for a comment', async () => {
      await request(app.getHttpServer())
        .post(`/api/likes/comments/${commentId}/toggle`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/likes/comments/${commentId}/count`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
      expect(response.body.likes).toBe(1);
    });
  });
});

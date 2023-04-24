import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UpdaterService } from '../src/updater/updater.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

let token;

const createApp = async () => {
  const moduleFixture: TestingModule =
    await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UpdaterService)
      .useValue({
        updatePosts: jest.fn(),
      })
      .compile();

  const app =
    moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true }),
  );
  await app.init();
  return app;
};

const createTestUser = async (
  app: INestApplication,
) => {
  const credentials = {
    email: 'oleh.paryshkura@gmail.com',
    password: 'very_secure_password',
  };

  const response = await request(
    app.getHttpServer(),
  )
    .post('/auth/signup')
    .send(credentials);

  return response.body.access_token;
};

const generatePosts = (quantity) => {
  const result = [];

  for (let i = 0; i < quantity; i++) {
    result.push({
      title: `Post ${i}`,
      description: `Description ${i}`,
      link: `https://medium.com/${i}`,
      pubDate: new Date().toISOString(),
    });
  }
  return result;
};

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    token = await createTestUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  let createdPostId: number;

  it('should forbid if token not set', async () => {
    const response = await request(
      app.getHttpServer(),
    ).get('/posts');

    expect(response.status).toBe(401);
  });

  it('should create a new post', async () => {
    const postData = {
      title: 'Test Post',
      description: 'Lorem ipsum dolor sit amet',
      link: 'https://medium.com',
      pubDate: new Date().toISOString(),
    };

    const response = await request(
      app.getHttpServer(),
    )
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(postData);

    expect(response.status).toBe(201);
    expect(response.body.title).toEqual(
      postData.title,
    );
    expect(response.body.description).toEqual(
      postData.description,
    );
    expect(response.body.link).toEqual(
      postData.link,
    );
    expect(response.body.pubDate).toEqual(
      postData.pubDate,
    );

    createdPostId = response.body.id;
  });

  it('should retrieve the created post', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toEqual(
      'Test Post',
    );
    expect(response.body.description).toEqual(
      'Lorem ipsum dolor sit amet',
    );
  });

  it('should update the created post', async () => {
    const postData = {
      title: 'Test Post (updated)',
      description:
        'Dolor sit amet, consectetur adipiscing elit',
    };

    const response = await request(
      app.getHttpServer(),
    )
      .patch(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(postData);

    expect(response.status).toBe(200);
    expect(response.body.title).toEqual(
      postData.title,
    );
    expect(response.body.description).toEqual(
      postData.description,
    );
  });

  it('should delete the created post', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .delete(`/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});

describe('Post pagination, search, filter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();

    const posts = generatePosts(20);
    for (const post of posts) {
      await prisma.post.create({ data: post });
    }
  });

  afterAll(async () => {
    await app.close();

    await prisma.post.deleteMany();
  });

  it('should return paginated posts when the "page" and "limit" parameters are provided', async () => {
    const page = 2;
    const limit = 2;

    const response = await request(
      app.getHttpServer(),
    )
      .get('/posts')
      .query({ page, limit })
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(
      limit,
    );
  });

  it('should return filtered posts when the "search" parameter is provided', async () => {
    const searchTerm = '13';

    const response = await request(
      app.getHttpServer(),
    )
      .get('/posts')
      .query({ search: searchTerm })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe(
      'Post 13',
    );
  });

  it('should return filtered posts when the "filter" parameter is provided', async () => {
    const filter = {
      link: 'https://medium.com/7',
    };

    const response = await request(
      app.getHttpServer(),
    )
      .get('/posts')
      .query({ filter })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe(
      'Post 7',
    );
  });

  it('should return sorted posts when the "sort" parameter is provided', async () => {
    const sortBy = 'title:desc';

    const response = await request(
      app.getHttpServer(),
    )
      .get('/posts')
      .query({ sort: sortBy, limit: 2, page: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].title).toBe(
      'Post 7',
    );
    expect(response.body.data[1].title).toBe(
      'Post 6',
    );
  });
});

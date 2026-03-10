import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/infrastructure/filters/domain-exception.filter';

/**
 * Tests E2E - Auth Flow
 * 
 * NOTE: Ces tests nécessitent une base de données de test.
 * Pour les exécuter: npm run test:e2e
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  // Increase timeout for E2E tests
  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same configuration as main.ts bootstrap()
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new DomainExceptionFilter());
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('devrait retourner 401 avec identifiants invalides', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait retourner 400 avec données manquantes', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('/api/v1/auth/me (GET)', () => {
    it('devrait retourner 401 sans token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });
  });
});

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './infrastructure/filters/domain-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix global
  app.setGlobalPrefix('api/v1');

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Filtre exceptions Domain → HTTP
  app.useGlobalFilters(new DomainExceptionFilter());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('GesClient Proplast API')
    .setDescription('API de gestion opérationnelle')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 API démarrée sur http://localhost:3000`);
  console.log(`📚 Swagger : http://localhost:3000/api/docs`);
}
bootstrap();

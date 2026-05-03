import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { execSync } from 'child_process';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SeedService } from './modules/admin/seed.service';
import { PrismaService } from './common/prisma.service';

const bootLogger = new Logger('Bootstrap');

// Run prisma db push before the app starts so tables always exist
function ensureSchema() {
  try {
    bootLogger.log('Running prisma db push…');
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      env: process.env,
    });
    bootLogger.log('Schema up to date');
  } catch (e) {
    bootLogger.error('prisma db push failed:', (e as Error).message);
  }
}

async function bootstrap() {
  ensureSchema();

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Delivery Platform API')
    .setDescription('Mini Uzum/Yandex/Uber style platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT ?? '4000', 10) || 4000;
  await app.listen(port, '0.0.0.0');

  // Auto-seed demo data if DB is empty (first deploy)
  try {
    const prisma = app.get(PrismaService);
    const count = await prisma.user.count();
    if (count === 0) {
      bootLogger.log('DB empty — running initial seed…');
      const seed = app.get(SeedService);
      await seed.runFullSeed();
      bootLogger.log('Initial seed complete');
    }
  } catch (e) {
    bootLogger.error('Auto-seed failed:', (e as Error).message);
  }
}

bootstrap();

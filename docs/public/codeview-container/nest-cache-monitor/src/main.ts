import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const testURL = 'cachetest';
  await app.listen(3000);
}
bootstrap();

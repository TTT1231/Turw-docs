import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TestCacheUsageModule } from './CacheUsage/testcacheUsage.module';

@Module({
  imports: [TestCacheUsageModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

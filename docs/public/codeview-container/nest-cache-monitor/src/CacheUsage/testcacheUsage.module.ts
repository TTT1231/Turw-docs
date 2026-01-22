import { Module } from '@nestjs/common';
import { MyCacheModule } from '../cache/cache.module';
import { CacheUsageController } from './cacheUsage.controller';

@Module({
  imports: [MyCacheModule],
  controllers: [CacheUsageController],
  providers: [],
})
export class TestCacheUsageModule {}

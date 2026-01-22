import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheTokensService } from './cacheTokens.service';
import { CacheMonitorService } from './cacheMonitor.service';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';

@Module({
  imports: [DiscoveryModule, CacheModule.register({})],
  providers: [CacheTokensService, CacheMonitorService, CacheService, CacheInterceptor],
  exports: [CacheMonitorService, CacheInterceptor, CacheService, CacheTokensService],
})
export class MyCacheModule {}

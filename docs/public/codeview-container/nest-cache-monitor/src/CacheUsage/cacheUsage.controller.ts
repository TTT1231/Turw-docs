import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { NoCache } from '../cache/decorator/noCache.decorator';
import { CacheInterceptor } from 'src/cache/cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { CacheMonitorService } from 'src/cache/cacheMonitor.service';

@Controller('cachetest')
@UseInterceptors(CacheInterceptor)
export class CacheUsageController {
  constructor(private readonly cacheMonitorService: CacheMonitorService) {}

  @Get()
  @CacheTTL(4000) //4s expired
  testCache() {
    return `测试缓存命中与未命中`;
  }

  @Get('print')
  @NoCache()
  printMetrics() {
    this.cacheMonitorService.printCacheMetrics();
    return '打印指标';
  }

  @Get('nocache')
  @NoCache()
  testNoCahe() {
    console.log('这个方法不会被缓存');
    return '这个方法不会被缓存';
  }
}

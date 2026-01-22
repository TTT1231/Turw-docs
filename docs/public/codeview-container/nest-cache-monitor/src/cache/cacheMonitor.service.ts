import { Injectable, type OnModuleInit, RequestMethod } from '@nestjs/common';
import { CacheTokensService } from './cacheTokens.service';
import { CacheService } from './cache.service';

import type { ICacheMetrics } from './type';

@Injectable()
export class CacheMonitorService implements OnModuleInit {
  private cacheMetrics: ICacheMetrics = {
    hit: 0,
    miss: 0,
    hitRate: 0,
    totalReadTime: 0,
    totalWriteTime: 0,
    readCount: 0,
    writeCount: 0,
    p95ReadTime: 0,
    p95WriteTime: 0,
    cacheTokenUsage: new Map<string, number>(),
    currentMemorySize: 0,
    //token映射过来的map
    cacheMap: undefined,
  };

  private readonly p95ReadTimesArr: number[] = [];
  private readonly p95WriteTimesArr: number[] = [];
  constructor(
    private readonly cacheTokesService: CacheTokensService,
    private readonly cacheService: CacheService,
  ) {}

  onModuleInit() {
    this.initCacheMap();
  }
  //TODO 初始化cacheMap
  private initCacheMap() {
    this.cacheMetrics.cacheMap = this.cacheTokesService.getCacheMap();
    if (!this.cacheMetrics.cacheMap) return;
  }
  //TODO 更新读指标
  private updateReadMetrics(duration: number, hit: boolean) {
    if (hit) {
      this.cacheMetrics.hit++;
    } else {
      this.cacheMetrics.miss++;
    }
    this.cacheMetrics.readCount++;
    this.cacheMetrics.totalReadTime += duration;
    this.p95ReadTimesArr.push(duration);
    this.updateP95ReadTime();
    this.cacheMetrics.hitRate = this.cacheMetrics.hit / (this.cacheMetrics.hit + this.cacheMetrics.miss);
  }
  //TODO 更新写指标
  private updateWriteMetrics(duration: number) {
    this.cacheMetrics.writeCount++;
    this.cacheMetrics.totalWriteTime += duration;
    this.p95WriteTimesArr.push(duration);
    this.updateP95WriteTime();
  }
  //TODO 更新p95读时间
  private updateP95ReadTime(): void {
    if (this.p95ReadTimesArr.length === 0) return;
    const sortedTimes = [...this.p95ReadTimesArr].sort((a, b) => a - b);
    const index = Math.ceil(0.95 * sortedTimes.length) - 1;
    this.cacheMetrics.p95ReadTime = sortedTimes[index];
  }
  //TODO 更新p95写时间
  private updateP95WriteTime(): void {
    if (this.p95WriteTimesArr.length === 0) return;
    const sortedTimes = [...this.p95WriteTimesArr].sort((a, b) => a - b);
    const index = Math.ceil(0.95 * sortedTimes.length) - 1;
    this.cacheMetrics.p95WriteTime = sortedTimes[index];
  }
  //TODO add cacheTokenUsage
  private addCacheTokenUsage(token: string): void {
    if (this.cacheMetrics.cacheTokenUsage.has(token)) {
      const currentCount = this.cacheMetrics.cacheTokenUsage.get(token) || 0;
      this.cacheMetrics.cacheTokenUsage.set(token, currentCount + 1);
    } else {
      this.cacheMetrics.cacheTokenUsage.set(token, 1);
    }
  }
  //TODO 获取缓存指标
  public getCacheMetrics(): ICacheMetrics {
    return this.cacheMetrics;
  }
  //TODO 获取所有被缓存控制器的keys
  public getAllCacheControllerKeys(): string[] {
    return this.cacheMetrics.cacheMap ? Array.from(this.cacheMetrics.cacheMap.keys()) : [];
  }
  //TODO 获取所有被缓存的keys-controllername_methodType_methodname
  public getAllCacheKeysCombine(): string[] {
    const allKeys: string[] = [];
    if (!this.cacheMetrics.cacheMap) return allKeys;
    this.cacheMetrics.cacheMap.forEach((value, key) => {
      value.forEach((method) => {
        allKeys.push(`${key}_${method}`);
      });
    });
    return allKeys;
  }

  //TODO: 判断某个控制器的某个方法是否被缓存
  public isRequireCache(controllerName: string, methodType: RequestMethod, methodName: string): boolean {
    const methodRequestName = RequestMethod[methodType];
    if (!this.cacheMetrics.cacheMap) return false;

    for (const value of this.getAllCacheKeysCombine()) {
      if (value === `${controllerName}_${methodRequestName}_${methodName}`) {
        return true;
      }
    }

    return false;
  }

  //========================================设置缓存指标========================================
  public async setCache<T = unknown>(key: string, value: T, ttl?: number): Promise<T> {
    const { result, executeTime } = await this.cacheService.setCache(key, value, ttl);
    this.updateWriteMetrics(executeTime);
    return result;
  }
  public async getCache<T = unknown>(key: string): Promise<T | undefined> {
    const { result, executeTime } = await this.cacheService.getCache<T>(key);
    this.updateReadMetrics(executeTime, !!result);

    //缓存过期还是没过期，只要读了缓存就算一次cacheTokenUsage使用
    this.addCacheTokenUsage(key);
    return result;
  }

  //========================================打印缓存指标========================================
  //TODO 打印缓存指标
  public printCacheMetrics(): void {
    console.table(this.cacheMetrics);
  }
  //TODO 打印缓存map
  public printAllKeysMap(): void {
    console.table(this.getAllCacheKeysCombine());
  }
  //TODO 打印当前正在使用的缓存map
  public printCacheUsageMap(): void {
    console.log('======================================当前正在使用的缓存map:===================================');
    console.table(this.cacheService.getCacheUsageMap());
  }
  //TODO 打印当前缓存总大小
  public printCacheTotalSize(): void {
    console.log('======================================当前缓存总大小:===================================');
    console.log(`当前缓存总大小: ${this.cacheService.getCacheTotalSize()} KB`);
  }
  //TODO 打印缓存token使用情况
  public printCacheTokenUsage(): void {
    console.log('======================================缓存token使用情况:===================================');
    console.table(
      Array.from(this.cacheService.getCacheUsageMap().entries()).map(([token, count]) => ({ token, count })),
    );
  }
  public printAll(): void {
    this.printAllKeysMap();
    this.printCacheUsageMap();
    this.printCacheTotalSize();
    this.printCacheTokenUsage();
  }
}

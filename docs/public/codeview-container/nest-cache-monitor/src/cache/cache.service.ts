import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { measureExecutionTime } from './utils/calcExecuteFun';
import type { ICacheResult, ISettingCacheResult } from './type';
import { diffTimeInMsNow, getTimeNowString } from './utils/day';

@Injectable()
export class CacheService {
  private cacheMap: Map<string, ICacheResult> = new Map();
  private allCacheKeys: Set<string> = new Set();
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * @returns @param result缓存结果 @param duration执行时间
   */
  public async setCache<T = unknown>(key: string, value: T, ttl?: number): Promise<ISettingCacheResult<T>> {
    console.log('设置缓存:', { key, value, ttl });
    const { result, executeTime } = await measureExecutionTime(async () => this.cacheManager.set(key, value, ttl));
    this.cacheMap.set(key, {
      value: result,
      settingTime: getTimeNowString(),
      duration: ttl || 0,
    });
    if (!this.allCacheKeys.has(key)) {
      this.allCacheKeys.add(key);
    }
    return { result, executeTime };
  }
  public async getCache<T = unknown>(key: string): Promise<ISettingCacheResult<T | undefined>> {
    return await measureExecutionTime(async () => this.cacheManager.get<T>(key));
  }
  /**
   * @description 获取当前还在缓存中的keys,也即在使用的keys
   */
  public getUsageCacheKeys(): string[] {
    if (this.cacheMap.size === 0) return [];
    const tempKeys: string[] = [];
    this.cacheMap.forEach((value, key) => {
      if (diffTimeInMsNow(value.settingTime) < value.duration) {
        tempKeys.push(key);
      }
    });
    return tempKeys;
  }

  /**
   * @description 获取当前仍在缓存有效期内的键值对（即正在使用的缓存）
   * @returns Map<string, ICacheResult> 仅包含未过期的缓存项
   */
  public getCacheUsageMap(): Map<string, ICacheResult> {
    const usageMap = new Map<string, ICacheResult>();
    const validKeys = this.getUsageCacheKeys(); // 获取未过期的 keys

    validKeys.forEach((key) => {
      const cacheItem = this.cacheMap.get(key);
      if (cacheItem) {
        usageMap.set(key, cacheItem);
      }
    });

    return usageMap;
  }

  /**
   * 获取当前所有缓存的总大小（以 KB 为单位，精确到小数点后两位）
   * @returns 总大小（KB）
   */
  public getCacheTotalSize(): number {
    const sizeMap = this.getCacheSizeMap();
    let totalSize = 0;

    sizeMap.forEach((sizeInKB) => {
      totalSize += sizeInKB;
    });

    return parseFloat(totalSize.toFixed(2));
  }
  /**
   * 获取每个缓存键值对的大小（以 KB 为单位，精确到小数点后两位）
   * @returns Map<string, number> 键为缓存 key，值为大小（KB）
   */
  public getCacheSizeMap(): Map<string, number> {
    const sizeMap = new Map<string, number>();

    this.cacheMap.forEach((value, key) => {
      // 计算当前键值对的 JSON 字符串大小（字节）
      const jsonString = JSON.stringify({ key, value });
      const sizeInBytes = Buffer.from(jsonString).length;

      // 转换为 KB 并保留两位小数
      const sizeInKB = parseFloat((sizeInBytes / 1024).toFixed(2));
      sizeMap.set(key, sizeInKB);
    });

    return sizeMap;
  }

  public printCache(): void {
    console.table(this.cacheMap);
  }
}

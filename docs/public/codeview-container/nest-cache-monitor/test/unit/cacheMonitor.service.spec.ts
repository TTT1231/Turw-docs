import { Test, TestingModule } from '@nestjs/testing';
import { RequestMethod } from '@nestjs/common';
import { CacheMonitorService } from '../../src/cache/cacheMonitor.service';
import { CacheTokensService } from '../../src/cache/cacheTokens.service';
import { CacheService } from '../../src/cache/cache.service';

describe('CacheMonitorService', () => {
  let service: CacheMonitorService;
  let cacheTokensService: CacheTokensService;
  let cacheService: CacheService;

  const mockCacheMap = new Map([
    ['TestController', ['GET_testMethod', 'POST_createMethod']],
    ['UserController', ['GET_getUser', 'DELETE_deleteUser']],
  ]);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheMonitorService,
        {
          provide: CacheTokensService,
          useValue: {
            getCacheMap: jest.fn().mockReturnValue(mockCacheMap),
          },
        },
        {
          provide: CacheService,
          useValue: {
            setCache: jest.fn(),
            getCache: jest.fn(),
            getCacheUsageMap: jest.fn().mockReturnValue(
              new Map([
                ['test-key-1', 5],
                ['test-key-2', 10],
              ]),
            ),
            getCacheTotalSize: jest.fn().mockReturnValue(1024),
          },
        },
      ],
    }).compile();

    service = module.get<CacheMonitorService>(CacheMonitorService);
    cacheTokensService = module.get<CacheTokensService>(CacheTokensService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize cache map on module init', () => {
      service.onModuleInit();
      const metrics = service.getCacheMetrics();
      expect(metrics.cacheMap).toBe(mockCacheMap);
    });

    it('should handle when cache map is undefined', () => {
      jest.spyOn(cacheTokensService, 'getCacheMap').mockReturnValue(undefined);
      service.onModuleInit();
      const metrics = service.getCacheMetrics();
      expect(metrics.cacheMap).toBeUndefined();
    });
  });

  describe('getCacheMetrics', () => {
    it('should return initial cache metrics', () => {
      const metrics = service.getCacheMetrics();
      expect(metrics).toMatchObject({
        hit: 0,
        miss: 0,
        hitRate: 0,
        totalReadTime: 0,
        totalWriteTime: 0,
        readCount: 0,
        writeCount: 0,
        p95ReadTime: 0,
        p95WriteTime: 0,
        currentMemorySize: 0,
      });
      expect(metrics.cacheTokenUsage).toBeInstanceOf(Map);
    });
  });

  describe('getAllCacheControllerKeys', () => {
    it('should return all controller keys', () => {
      service.onModuleInit();
      const keys = service.getAllCacheControllerKeys();
      expect(keys).toEqual(['TestController', 'UserController']);
    });

    it('should return empty array when cacheMap is undefined', () => {
      const keys = service.getAllCacheControllerKeys();
      expect(keys).toEqual([]);
    });
  });

  describe('getAllCacheKeysCombine', () => {
    it('should return combined cache keys', () => {
      service.onModuleInit();
      const keys = service.getAllCacheKeysCombine();
      expect(keys).toContain('TestController_GET_testMethod');
      expect(keys).toContain('TestController_POST_createMethod');
      expect(keys).toContain('UserController_GET_getUser');
      expect(keys).toContain('UserController_DELETE_deleteUser');
      expect(keys).toHaveLength(4);
    });

    it('should return empty array when cacheMap is undefined', () => {
      const keys = service.getAllCacheKeysCombine();
      expect(keys).toEqual([]);
    });
  });

  describe('isRequireCache', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should return true when method is cached', () => {
      const result = service.isRequireCache('TestController', RequestMethod.GET, 'testMethod');
      expect(result).toBe(true);
    });

    it('should return true for POST method', () => {
      const result = service.isRequireCache('TestController', RequestMethod.POST, 'createMethod');
      expect(result).toBe(true);
    });

    it('should return false when method is not cached', () => {
      const result = service.isRequireCache('TestController', RequestMethod.GET, 'notCachedMethod');
      expect(result).toBe(false);
    });

    it('should return false when controller is not cached', () => {
      const result = service.isRequireCache('NotExistController', RequestMethod.GET, 'testMethod');
      expect(result).toBe(false);
    });

    it('should return false when cacheMap is undefined', () => {
      jest.spyOn(cacheTokensService, 'getCacheMap').mockReturnValue(undefined);
      const newService = new CacheMonitorService(cacheTokensService, cacheService);
      const result = newService.isRequireCache('TestController', RequestMethod.GET, 'testMethod');
      expect(result).toBe(false);
    });
  });

  describe('setCache', () => {
    it('should set cache and update write metrics', async () => {
      const mockResult = { data: 'test' };
      jest.spyOn(cacheService, 'setCache').mockResolvedValue({
        result: mockResult,
        executeTime: 10,
      });

      const result = await service.setCache('test-key', mockResult, 60);

      expect(result).toEqual(mockResult);
      const metrics = service.getCacheMetrics();
      expect(metrics.writeCount).toBe(1);
      expect(metrics.totalWriteTime).toBe(10);
      expect(metrics.p95WriteTime).toBe(10);
    });

    it('should update write metrics for multiple writes', async () => {
      jest
        .spyOn(cacheService, 'setCache')
        .mockResolvedValueOnce({ result: 'value1', executeTime: 5 })
        .mockResolvedValueOnce({ result: 'value2', executeTime: 15 })
        .mockResolvedValueOnce({ result: 'value3', executeTime: 10 });

      await service.setCache('key1', 'value1');
      await service.setCache('key2', 'value2');
      await service.setCache('key3', 'value3');

      const metrics = service.getCacheMetrics();
      expect(metrics.writeCount).toBe(3);
      expect(metrics.totalWriteTime).toBe(30);
      expect(metrics.p95WriteTime).toBe(15);
    });
  });

  describe('getCache', () => {
    it('should get cache and update read metrics on hit', async () => {
      const mockResult = { data: 'cached-data' };
      jest.spyOn(cacheService, 'getCache').mockResolvedValue({
        result: mockResult,
        executeTime: 5,
      });

      const result = await service.getCache('test-key');

      expect(result).toEqual(mockResult);
      const metrics = service.getCacheMetrics();
      expect(metrics.hit).toBe(1);
      expect(metrics.miss).toBe(0);
      expect(metrics.hitRate).toBe(1);
      expect(metrics.readCount).toBe(1);
      expect(metrics.totalReadTime).toBe(5);
      expect(metrics.p95ReadTime).toBe(5);
      expect(metrics.cacheTokenUsage.get('test-key')).toBe(1);
    });

    it('should update read metrics on cache miss', async () => {
      jest.spyOn(cacheService, 'getCache').mockResolvedValue({
        result: undefined,
        executeTime: 3,
      });

      const result = await service.getCache('missing-key');

      expect(result).toBeUndefined();

      const metrics = service.getCacheMetrics();
      expect(metrics.hit).toBe(0);
      expect(metrics.miss).toBe(1);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.readCount).toBe(1);
      expect(metrics.totalReadTime).toBe(3);
    });

    it('should calculate correct hit rate', async () => {
      jest
        .spyOn(cacheService, 'getCache')
        .mockResolvedValueOnce({ result: 'hit1', executeTime: 5 })
        .mockResolvedValueOnce({ result: undefined, executeTime: 3 })
        .mockResolvedValueOnce({ result: 'hit2', executeTime: 4 })
        .mockResolvedValueOnce({ result: undefined, executeTime: 2 });

      await service.getCache('key1');
      await service.getCache('key2');
      await service.getCache('key3');
      await service.getCache('key4');

      const metrics = service.getCacheMetrics();
      expect(metrics.hit).toBe(2);
      expect(metrics.miss).toBe(2);
      expect(metrics.hitRate).toBe(0.5);
      expect(metrics.readCount).toBe(4);
      expect(metrics.totalReadTime).toBe(14);
    });

    it('should track cache token usage correctly', async () => {
      jest.spyOn(cacheService, 'getCache').mockResolvedValue({
        result: 'data',
        executeTime: 5,
      });

      await service.getCache('key1');
      await service.getCache('key1');
      await service.getCache('key2');
      await service.getCache('key1');

      const metrics = service.getCacheMetrics();
      expect(metrics.cacheTokenUsage.get('key1')).toBe(3);
      expect(metrics.cacheTokenUsage.get('key2')).toBe(1);
    });

    it('should calculate p95 read time correctly', async () => {
      const times = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 100];

      for (const time of times) {
        jest.spyOn(cacheService, 'getCache').mockResolvedValueOnce({
          result: 'data',
          executeTime: time,
        });
        await service.getCache(`key-${time}`);
      }

      const metrics = service.getCacheMetrics();
      // p95 of the array should be around 50-100
      expect(metrics.p95ReadTime).toBeGreaterThan(40);
    });
  });

  describe('print methods', () => {
    let consoleSpy: jest.SpyInstance;
    let consoleTableSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleTableSpy = jest.spyOn(console, 'table').mockImplementation();
      service.onModuleInit();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleTableSpy.mockRestore();
    });

    it('should print cache metrics', () => {
      service.printCacheMetrics();
      expect(consoleTableSpy).toHaveBeenCalledWith(service.getCacheMetrics());
    });

    it('should print all keys map', () => {
      service.printAllKeysMap();
      expect(consoleTableSpy).toHaveBeenCalledWith(service.getAllCacheKeysCombine());
    });

    it('should print cache usage map', () => {
      service.printCacheUsageMap();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('当前正在使用的缓存map'));
      expect(consoleTableSpy).toHaveBeenCalled();
    });

    it('should print cache total size', () => {
      service.printCacheTotalSize();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('当前缓存总大小'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('1024 KB'));
    });

    it('should print cache token usage', () => {
      service.printCacheTokenUsage();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('缓存token使用情况'));
      expect(consoleTableSpy).toHaveBeenCalled();
    });

    it('should print all information', () => {
      service.printAll();
      expect(consoleTableSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty p95 arrays', () => {
      const metrics = service.getCacheMetrics();
      expect(metrics.p95ReadTime).toBe(0);
      expect(metrics.p95WriteTime).toBe(0);
    });

    it('should handle single value in p95 calculation', async () => {
      jest.spyOn(cacheService, 'getCache').mockResolvedValue({
        result: 'data',
        executeTime: 42,
      });

      await service.getCache('single-key');

      const metrics = service.getCacheMetrics();
      expect(metrics.p95ReadTime).toBe(42);
    });

    it('should handle cache token usage for new keys', async () => {
      jest.spyOn(cacheService, 'getCache').mockResolvedValue({
        result: 'data',
        executeTime: 5,
      });

      await service.getCache('new-key');

      const metrics = service.getCacheMetrics();
      expect(metrics.cacheTokenUsage.has('new-key')).toBe(true);
      expect(metrics.cacheTokenUsage.get('new-key')).toBe(1);
    });
  });
});

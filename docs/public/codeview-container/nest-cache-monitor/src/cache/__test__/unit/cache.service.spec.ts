import { Test, type TestingModule } from '@nestjs/testing';
import { CacheService } from '../../cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

type MockCacheManager = {
  get: jest.Mock<Promise<any>, [string]>;
  set: jest.Mock<Promise<any>, [string, any, number?]>;
};
describe('CacheService测试', () => {
  let cacheService: CacheService;
  let cacheManager: MockCacheManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();
    cacheService = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });
  afterEach(() => {
    // 每次测试后清除 mock 的调用记录
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(cacheService).toBeDefined();
  });
  describe('获取或设置缓存测试', () => {
    it('get缓存未命中，第二次get命中', async () => {
      cacheManager.get.mockResolvedValueOnce(undefined).mockResolvedValueOnce('testData');
      cacheManager.get.mockResolvedValueOnce(undefined).mockImplementationOnce((key: string) => {
        if (key === 'testKey') {
          return Promise.resolve('testData');
        }
        return Promise.resolve(undefined);
      });
      const key = 'testKey';

      const { result: firstResultMiss } = await cacheService.getCache(key);
      expect(firstResultMiss).toBeUndefined();

      // 设置缓存,这里就是第二次调用mock的get方法

      const { result: secondResultHit } = await cacheService.getCache(key);
      expect(secondResultHit).toBe('testData');

      cacheService.printCache();
    });
    it('get缓存未命中，set缓存，get命中', async () => {
      const key = 'newKey';
      const value = { data: 'someData' };
      const ttl = 2000; // 2秒

      cacheManager.get.mockResolvedValueOnce(undefined);
      cacheManager.set.mockResolvedValueOnce(value);
      cacheManager.get.mockResolvedValueOnce(value);

      // 初始get应该未命中
      const { result: initialGet } = await cacheService.getCache(key);
      expect(initialGet).toBeUndefined();

      const { result: setResult } = await cacheService.setCache(key, value, ttl);
      expect(setResult).toEqual(value);

      const { result: secondGet } = await cacheService.getCache(key);
      expect(secondGet).toEqual(value);
    });
  });
});

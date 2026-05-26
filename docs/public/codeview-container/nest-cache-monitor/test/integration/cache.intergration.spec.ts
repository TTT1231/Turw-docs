import { type TestingModule, Test } from '@nestjs/testing';
import { CacheService } from '../../src/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

describe('cacheService集成测试', () => {
  let cacheService: CacheService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({})],
      providers: [CacheService],
    }).compile();
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('cacheService should be defined', () => {
    expect(cacheService).toBeDefined();
  });

  it('第一次缓存获取失败，未命中', async () => {
    const { result } = await cacheService.getCache('testKey');
    expect(result).toBeUndefined();
  });

  it('未命中缓存后，设置缓存，再次获取命中，缓存过期后，再次获取失败', async () => {
    const key = 'testKey';
    const value = 'nihao';
    const ttl = 1000;

    const { result: getFristUndefined } = await cacheService.getCache('testKey');
    expect(getFristUndefined).toBeUndefined();

    const { result: setResultFirst } = await cacheService.setCache(key, value, ttl);
    expect(setResultFirst).toBe('nihao');

    const { result: getResultSecond } = await cacheService.getCache(key);
    expect(getResultSecond).toBe('nihao');

    //未过期之前，在useageMap中能找到
    const usageMapBeforeExpire = cacheService.getCacheUsageMap();
    expect(usageMapBeforeExpire.has(key)).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, ttl + 1)); // 等待缓存过期
    const { result: getResultThird } = await cacheService.getCache(key);
    expect(getResultThird).toBeUndefined();

    //过期之后，在useageMap中找不到
    const usageMapAfterExpire = cacheService.getCacheUsageMap();
    expect(usageMapAfterExpire.has(key)).toBe(false);
  });
});

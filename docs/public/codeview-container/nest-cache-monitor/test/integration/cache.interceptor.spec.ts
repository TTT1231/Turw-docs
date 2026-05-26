import { Test, type TestingModule } from '@nestjs/testing';
import { CacheMonitorService } from '../../src/cache/cacheMonitor.service';
import { MyCacheModule } from '../../src/cache/cache.module';
import { CacheService } from '../../src/cache/cache.service';
import { CacheTokensService } from '../../src/cache/cacheTokens.service';
import {
   Controller,
   Get,
   INestApplication,
   UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '../../src/cache/cache.interceptor';
import request from 'supertest';
import {
   Reflector,
   type DiscoveryService,
   type MetadataScanner,
} from '@nestjs/core';
import { NoCache } from '../../src/cache/decorator/noCache.decorator';
import { Server } from 'http';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('test')
@UseInterceptors(CacheInterceptor)
class TestController {
   @Get()
   getData() {
      return '你好啊，缓存测试，这里是缓存测试的结果';
   }
   @Get('no-cache')
   @NoCache()
   getNoCacheData() {
      console.log('这里是不缓存的结果,测试NoCache装饰器是否生效');
      return '你好啊，这里是不缓存的结果';
   }
   @Get('expire-3s')
   @CacheTTL(3000)
   expire3s() {
      return '你好啊，这里是3秒过期的缓存测试';
   }
}

describe('缓存拦截器集成测试', () => {
   let cacheMonitorService: CacheMonitorService;
   let cacheService: CacheService;
   let cacheTokensService: CacheTokensService;
   let app: INestApplication;

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         imports: [MyCacheModule],
         controllers: [TestController],
      }).compile();

      app = module.createNestApplication();
      cacheMonitorService =
         module.get<CacheMonitorService>(CacheMonitorService);
      cacheTokensService = module.get<CacheTokensService>(CacheTokensService);
      cacheService = module.get<CacheService>(CacheService);
      await app.init();
   });
   describe('测试全部DI是否正常', () => {
      it('测试全部DI服务是否正常', () => {
         expect(cacheService).toBeDefined();
         expect(cacheMonitorService).toBeDefined();
         expect(cacheTokensService).toBeDefined();
      });

      it('cacheInterceptor所需求的DI是否正常', () => {
         const cacheInterceptorGlobalInstance =
            app.get<CacheInterceptor>(CacheInterceptor);
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const httpAdapterHost = (cacheInterceptorGlobalInstance as any)
            .httpAdapterHost;
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const cacheMonitorService = (cacheInterceptorGlobalInstance as any)
            .cacheMonitorService;
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
         const reflector = (cacheInterceptorGlobalInstance as any).reflector;
         expect(httpAdapterHost).toBeDefined();
         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
         expect(httpAdapterHost!.httpAdapter).toBeDefined();
         expect(cacheMonitorService).toBeDefined();
         expect(reflector).toBeDefined();
      });

      it('cacheService所需求的DI是否正常', () => {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
         const cacheManager = (cacheService as any).cacheManager;
         expect(cacheManager).toBeDefined();
      });

      it('cacheTokensService所需求的DI是否正常', () => {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
         const reflector = (cacheTokensService as any).reflector as Reflector;

         const discoveryService = (cacheTokensService as any)
            .discorveryService as DiscoveryService;

         const metadataScanner = (cacheTokensService as any)
            .metadataScanner as MetadataScanner;

         expect(reflector).toBeDefined();
         expect(discoveryService).toBeDefined();
         expect(metadataScanner).toBeDefined();

         const controllers = discoveryService.getControllers();
         const TestControllerInstance = controllers[0];
         expect(TestControllerInstance.metatype).toBe(TestController);
      });

      it('cacheService所需求的DI是否正常', () => {});
   });
   describe('测试缓存拦截器测试', () => {
      it('缓存拦截器是否正常工作', async () => {
         //检查映射关系是否正确
         const map = cacheTokensService['map'];
         const testMapController = map!.get('TestController');
         expect(testMapController).toContain('GET_getData');

         //第一次未命中缓存
         const cacheKey = '/test';
         const server: Server = app.getHttpServer();
         const response = await request(server).get(cacheKey).expect(200);

         expect(response.text).toBe('你好啊，缓存测试，这里是缓存测试的结果');
         cacheMonitorService.printCacheMetrics();
         expect(cacheMonitorService.getCacheMetrics().miss).toBe(1);
         expect(response.headers['x-cache']).toBe('MISS');

         //第二次命中缓存
         const secondResponse = await request(server).get(cacheKey).expect(200);
         expect(secondResponse.text).toBe(
            '你好啊，缓存测试，这里是缓存测试的结果',
         );
         expect(cacheMonitorService.getCacheMetrics().hit).toBe(1);
         expect(cacheMonitorService.getCacheMetrics().hit).toBe(1);
         expect(secondResponse.headers['x-cache']).toBe('HIT');
      });

      it('缓存过期是否正常', async () => {
         const server: Server = app.getHttpServer();
         const firstResponse = await request(server)
            .get('/test/expire-3s')
            .expect(200);
         expect(firstResponse.text).toBe('你好啊，这里是3秒过期的缓存测试');
         expect(firstResponse.headers['x-cache']).toBe('MISS');

         const secondResponse = await request(server)
            .get('/test/expire-3s')
            .expect(200);
         expect(secondResponse.text).toBe('你好啊，这里是3秒过期的缓存测试');
         expect(secondResponse.headers['x-cache']).toBe('HIT');

         //缓存过期
         await new Promise((resolve) => setTimeout(resolve, 3000 + 1));

         const thirdResponse = await request(server)
            .get('/test/expire-3s')
            .expect(200);
         expect(thirdResponse.text).toBe('你好啊，这里是3秒过期的缓存测试');
         expect(thirdResponse.headers['x-cache']).toBe('MISS');
         expect(cacheMonitorService.getCacheMetrics().miss).toBe(2);
      });
   });

   afterEach(async () => {
      await app.close();
   });
});

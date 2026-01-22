import { CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { Injectable, type OnModuleInit, RequestMethod } from '@nestjs/common';
import { INTERCEPTORS_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

import { NOCACHE } from './constant';
import { isGlobalCacheInterceptor, CACHE_INTERCEPTOR_NAME } from './constant';

import type { Controller, NestInterceptor, Type } from '@nestjs/common/interfaces';
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
/**
 * @description: 记录所有被缓存标记方法的token，存储在map中
 *               解决缓存监控必须要被调用问题
 */
@Injectable()
export class CacheTokensService implements OnModuleInit {
  private map: Map<string, string[]> | undefined = undefined;
  constructor(
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
    private readonly discorveryService: DiscoveryService,
  ) {}

  //TODO: 向外暴露所有被缓存拦截器修饰控制器的GET方法的token,用于缓存监控与优化
  onModuleInit() {
    const controllers: InstanceWrapper[] = this.discorveryService.getControllers();
    let cacheController: Array<InstanceWrapper<Controller>> = [];
    if (this.isGlobalCacheInterceptor()) {
      cacheController.push(...(controllers as Array<InstanceWrapper<Controller>>));
    } else {
      this.initCacheController(cacheController, controllers as InstanceWrapper<Controller>[]);
    }
    cacheController = this.excludeNoCacheController(cacheController);

    //方法存储映射
    this.map = this.mapCacheAndStorage(cacheController);
  }

  //TODO:排除被@NoCache修饰的控制器，如果@NoCache与CacheTTL同时存在，那么以@NoCache为准
  private excludeNoCacheController(cacheController: InstanceWrapper<Controller>[]): InstanceWrapper<Controller>[] {
    return cacheController.filter((controller) => {
      const noCacheMeta = this.reflector.get<boolean>(NOCACHE, controller.metatype!);
      return noCacheMeta === true ? false : true;
    });
  }

  //TODO:将所有被 CacheInterceptor 修饰的控制器存入 cacheController
  private initCacheController(cacheController: InstanceWrapper[], allControllers: InstanceWrapper<Controller>[]) {
    allControllers.forEach((controller) => {
      const interceptors = this.reflector.get<Type<NestInterceptor>[]>(INTERCEPTORS_METADATA, controller.metatype!);
      // 使用类名比较，避免直接引用 CacheInterceptor 类导致循环依赖
      if (
        interceptors !== undefined &&
        interceptors.some((interceptor) => interceptor.name === CACHE_INTERCEPTOR_NAME)
      ) {
        cacheController.push(controller);
      }
    });
  }
  /**
   * TODO:是否是全局缓存，如果是全局缓存，就要扫描所有控制器的GET方法
   * @returns true | false ，true表示自动缓存所有控制器的GET方法
   */
  private isGlobalCacheInterceptor(): boolean {
    return isGlobalCacheInterceptor();
  }

  /**
   * TODO:将需要缓存的控制器中的GET方法存储起来
   * @intent  'AppController': ['GET_getMethod1', 'POST_getMethod2']
   * @rteurn Map<string, string[]>
   *
   */
  private mapCacheAndStorage(cacheController: Array<InstanceWrapper<Controller>>): Map<string, string[]> {
    const resultMap = new Map<string, string[]>();

    // 将GET方法存储起来，排除被@NoCache修饰的方法
    cacheController.forEach((controller: InstanceWrapper<Controller>) => {
      const allMethods = this.metadataScanner.getAllMethodNames(
        controller.metatype!.prototype as Record<string, unknown>,
      );
      const getMethods = allMethods
        .map((methodName) => {
          const method = (controller.metatype!.prototype as Record<string, unknown>)[methodName] as (
            ...args: unknown[]
          ) => unknown;
          const requestMethod = this.reflector.get<RequestMethod>(METHOD_METADATA, method);
          const cacheTTLMeta = this.reflector.get<number | undefined>(CACHE_TTL_METADATA, method);
          const noCacheMeta: boolean | undefined = this.reflector.get<boolean | undefined>(NOCACHE, method);

          const shouldInclude =
            (cacheTTLMeta === undefined && noCacheMeta === undefined && requestMethod === RequestMethod.GET) ||
            (cacheTTLMeta !== undefined && noCacheMeta === undefined);

          return shouldInclude ? `${RequestMethod[requestMethod]}_${methodName}` : undefined;
        })
        .filter((methodName): methodName is string => methodName !== undefined);

      if (getMethods.length > 0) {
        resultMap.set(controller.name as string, getMethods);
      }
    });

    console.log('==================映射关系==================');
    console.table(resultMap);
    return resultMap;
  }
  /**
   * @description : 返回一个状态，true表示controller中
   */

  /**
   * @description: 缓存map打印
   */
  public printMap(map: Map<string, string[]>) {
    console.log('--- Cached Controllers and their GET Methods ---');
    map.forEach((value, key) => {
      console.log(`${key} => ${value.join(', ')}`);
    });
  }

  /**
   *
   * @returns @result1 Map<string, string[]> 返回应用中被缓存标记GET方法控制器与方法token映射
   * @returns @result2 undefined 没有启用缓存或没有被缓存标记的GET方法
   */
  public getCacheMap(): Map<string, string[]> | undefined {
    return this.map;
  }
}

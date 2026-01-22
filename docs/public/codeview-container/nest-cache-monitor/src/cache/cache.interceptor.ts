import { CACHE_KEY_METADATA } from '@nestjs/cache-manager';
import {
  Injectable,
  CallHandler,
  ExecutionContext,
  Inject,
  NestInterceptor,
  Optional,
  type RequestMethod,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { CACHE_TTL_METADATA, Cache } from '@nestjs/cache-manager';
import { StreamableFile, Logger } from '@nestjs/common';
import { isNil, isFunction } from '@nestjs/common/utils/shared.utils';
import { tap } from 'rxjs/operators';
import { Reflector, HttpAdapterHost } from '@nestjs/core';
import { CacheMonitorService } from './cacheMonitor.service';

import type { Request, Response } from 'express';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { getTimeNowString } from './utils/day';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  protected allowedMethods = ['GET'];

  constructor(
    @Optional()
    @Inject()
    protected readonly httpAdapterHost: HttpAdapterHost,
    protected readonly reflector: Reflector,
    private readonly cacheMonitorService: CacheMonitorService,
  ) {}
  protected trackBy(context: ExecutionContext): string | undefined {
    const httpAdapter = this.httpAdapterHost?.httpAdapter;
    const isHttpApp = httpAdapter && !!httpAdapter.getRequestMethod;
    const cacheMetadata: string | undefined = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());

    if (!isHttpApp || cacheMetadata) {
      return cacheMetadata;
    }

    const request: Request = context.switchToHttp().getRequest();
    //在进入该trackBy之前，已经做了请求方法的过滤
    //  if (this.isRequestCacheable(context)) {
    //    return undefined;
    //  }
    return httpAdapter.getRequestUrl(request) as string | undefined;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    //排除被@NoCache装饰器修饰的方法
    const isRequireCache = this.cacheMonitorService.isRequireCache(
      context.getClass().name,
      this.reflector.get<RequestMethod>(METHOD_METADATA, context.getHandler()),
      context.getHandler().name,
    );

    if (!isRequireCache) {
      return next.handle();
    }

    const key = this.trackBy(context);

    const ttlValueOrFactory: number | ((context: ExecutionContext) => Promise<number> | number) | null =
      this.reflector.get<number | ((context: ExecutionContext) => Promise<number> | number) | null>(
        CACHE_TTL_METADATA,
        context.getHandler(),
      ) ??
      this.reflector.get<number | ((context: ExecutionContext) => Promise<number> | number) | null>(
        CACHE_TTL_METADATA,
        context.getClass(),
      ) ??
      null; //先在方法级别查找、然后就是类级别查找，都没有返回null

    if (!key) {
      return next.handle();
    }

    try {
      const value: unknown = await this.cacheMonitorService.getCache(key);

      this.setHeadersWhenHttp(context, value);
      //
      this.setHeadersWhenHttp(context, value);

      if (!isNil(value)) {
        console.log(`缓存命中，key: ${key}， time: ${getTimeNowString()}`);
        return of(value);
      }

      //await ttlValueOrFactory(context) 动态ttl
      //ttlValueOrFactory静态ttl
      const ttl = isFunction(ttlValueOrFactory) ? await ttlValueOrFactory(context) : ttlValueOrFactory;
      const now = getTimeNowString();
      console.log(`缓存未命中，key: ${key}，ttl: ${ttl}, time: ${now}`);

      return next.handle().pipe(
        tap((response: unknown) => {
          if (response instanceof StreamableFile) {
            return;
          }

          // 明确参数类型，避免扩展参数类型错误
          if (!isNil(ttl)) {
            void (async () => {
              try {
                await this.cacheMonitorService.setCache(key, response, ttl);
              } catch (err) {
                Logger.error(
                  `An error has occurred when inserting "key: ${key}", "value: ${safeStringify(response)}"`,
                  (err as Error).stack,
                  'CacheInterceptor',
                );
              }
            })();
          } else {
            void (async () => {
              try {
                await this.cacheMonitorService.setCache(key, response);
              } catch (err) {
                Logger.error(
                  `An error has occurred when inserting "key: ${key}", "value: ${safeStringify(response)}"`,
                  (err as Error).stack,
                  'CacheInterceptor',
                );
              }
            })();
          }
        }),
      );
      // 类型安全的序列化方法，避免 [object Object] 问题
      function safeStringify(val: unknown): string {
        if (typeof val === 'object' && val !== null) {
          try {
            return JSON.stringify(val);
          } catch {
            return '[Unserializable Object]';
          }
        }
        return String(val);
      }
    } catch {
      return next.handle();
    }
  }

  protected isRequestCacheable(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    return this.allowedMethods.includes(req.method);
  }

  protected setHeadersWhenHttp(context: ExecutionContext, value: unknown): void {
    if (!this.httpAdapterHost) {
      return;
    }

    const { httpAdapter } = this.httpAdapterHost;
    if (!httpAdapter) {
      return;
    }

    const response = context.switchToHttp().getResponse<Response>();
    httpAdapter.setHeader(response, 'X-Cache', isNil(value) ? 'MISS' : 'HIT');
  }
}

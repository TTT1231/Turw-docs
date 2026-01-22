const GLOBAL_CACHE_INTERCEPTOR = 'CacheMonitorInterceptor';
const NOCACHE = 'cache_nocahe';
// 缓存拦截器的类名，用于反射检查，避免循环依赖
export const CACHE_INTERCEPTOR_NAME = 'CacheInterceptor';

// 是否开启全局缓存拦截器标志
let IS_GLOBAL_CACHE_INTERCEPTOR = false;

export function setGlobalCacheInterceptor(value: boolean): void {
  IS_GLOBAL_CACHE_INTERCEPTOR = value;
}

export function isGlobalCacheInterceptor(): boolean {
  return IS_GLOBAL_CACHE_INTERCEPTOR;
}

export { GLOBAL_CACHE_INTERCEPTOR, NOCACHE };

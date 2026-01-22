# 缓存埋点与监控

这里可以直接使用缓存拦截器设置部分缓存，也可以设置全局缓存，设置全局缓存时对于一些不需要缓存的方法可以使用@NoCache()装饰器进行修饰，对 Controller 修饰时，其所有方法都不会被缓存

## 使用

**示例使用：**：
参考 src/CacheUsage/cacheUsage.controller.ts 用法

如果是要启动全局缓存，注意要设置 setGlobalCacheInterceptor(true)该函数位于 cache/constant.ts 中
用来标记缓存拦截器是否被全局使用，标记后后面的发现服务中 controller 用这个来过滤掉 controller

**实际使用**

- 你可以访问`/cachetest`用来测试缓存命中还是没有命中
- 也可以访问`/cachetest/print`用来打印缓存的指标，也可以查看缓存的命中次数用来查看或者优化缓存
- 你也可以访问`/cachetest/nocache`测试不需要缓存

## 缓存测试

查看`src/cache/__test__`测试代码运行 jest 测试代码查看具体测试用例

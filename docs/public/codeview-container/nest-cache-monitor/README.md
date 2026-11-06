# 缓存埋点与监控

此示例通过缓存拦截器缓存响应，并记录缓存指标。`@NoCache()` 可标记不需要缓存的方法或控制器。

## 使用

参考 `src/CacheUsage/cacheUsage.controller.ts`：控制器通过 `@UseInterceptors(CacheInterceptor)` 启用拦截器，`@CacheTTL(4000)` 为示例接口设置 4 秒缓存。

如果改为全局使用拦截器，需要在 `src/cache/constant.ts` 中调用 `setGlobalCacheInterceptor(true)`，让发现服务按全局模式处理控制器。

启动后可以访问：

| 路径 | 用途 |
| --- | --- |
| `/cachetest` | 连续请求，观察缓存命中和过期后的行为 |
| `/cachetest/print` | 在服务端打印缓存指标；该接口不缓存 |
| `/cachetest/nocache` | 验证 `@NoCache()` 的效果 |

## 缓存测试

测试位于 `test/unit` 和 `test/integration`。在示例目录安装依赖后运行 `npm test`；仅运行集成测试可使用 `npm run test:e2e`。

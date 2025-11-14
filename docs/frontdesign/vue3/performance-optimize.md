# 性能优化

<Tip title="提示">
格式优化、懒加载、CDN、代码压缩、请求合并（可以使用es6特性allSettled并发）、以及缓存策略、代码分割、Tree Shaking
</Tip>

## vite构建优化

使用vite-plugin-inspect监控打包，开启代码压缩、css代码分割和关闭源码映射,以及删除console.log打印,和删除未使用变量、注释和混淆变量。

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Inspect from 'vite-plugin-inspect';

// https://vite.dev/config/
export default defineConfig({
   plugins: [
      vue(),
      Inspect({
         enabled: true,
         build: true,
         exclude: /node_modules/
      })
   ],
   build: {
      minify: 'terser', //默认
      sourcemap: false,
      cssCodeSplit: true, //css代码分离 // [!code warning]
      terserOptions: {
         //具体也可参考 https://terser.org/docs/api-reference/#minify-options
         /**
          * compress 压缩选项  // [!code error]
          * format   格式选项  // [!code error]
          * mangle   混淆选项  // [!code error]
          */
         //@ts-ignore `terser` may not be installed
         compress: {
            drop_console: true, // 删除console           // [!code warning]
            drop_debugger: true, // 删除调试断点         // [!code warning]
            arguments: true, // 删除未使用的函数参数     // [!code warning]
            unused: true, // 删除未使用的变量           // [!code warning]
            dead_code: true // 删除死代码             // [!code warning]
         },
         format: {
            comments: false // 删除注释             // [!code warning]
         },
         mangle: {
            toplevel: true //混淆顶级变量名        // [!code warning]
         }
      }
   }
});
```

## 图片压缩

`vite-plugin-imagemin`vite插件为例（还是使用vite）

```ts
//options
ViteImagemin({
   gifsicle: {
      optimizationLevel: 3, // 设置 GIF 压缩等级（0-3）      // [!code warning]
      interlaced: false // 是否进行逐行扫描优化              // [!code warning]
   },
   optipng: {
      optimizationLevel: 5 // 设置 PNG 压缩等级（0-7）      // [!code warning]
   },
   mozjpeg: {
      quality: 75 // 设置 JPEG 压缩质量（0-100）            // [!code warning]
   },
   pngquant: {
      quality: [0.6, 0.8] // 设置 PNG 压缩质量范围          // [!code warning]
   },
   svgo: {
      plugins: [
         { removeViewBox: false } // 保留视图框            // [!code warning]
      ]
   },
   webp: {
      quality: 75 // 设置 WebP 图片质量                    // [!code warning]
   }
});
```

## 缓存策略

### 缓存方式对比

| 方式            | 存储位置   | 状态码               | 使用场景       | 说明                                              |
| --------------- | ---------- | -------------------- | -------------- | ------------------------------------------------- |
| **Storage API** | 浏览器本地 | -                    | 持久化数据     | 包括 localStorage（永久）、sessionStorage（会话） |
| **强缓存**      | 内存/硬盘  | `200 (from cache)`   | 不变的静态资源 | 浏览器自动调度，不可自定义                        |
| **协商缓存**    | 服务器验证 | `304 (Not Modified)` | 变化的动态资源 | 需要与服务器验证                                  |

### 协商缓存策略

#### Last-Modified / If-Modified-Since

- **适用于** - 静态文件（JS、TS、IMG、CSS 等）
- **原理** - 对比文件修改时间
- **精确度** - 中等（以秒为单位）

#### ETag / If-None-Match

- **适用于** - 动态内容、API 数据
- **原理** - 基于内容哈希计算，变化即改变
- **精确度** - 高（内容级别）

<Tip title="提示">
两种方式可配对使用，服务器会根据 `If-Modified-Since` 或 `If-None-Match` 判断资源是否变化
</Tip>

::: code-group

```ts [negotiate.ts]
import express from 'express';
import { createHash } from 'node:crypto';

//[!code ++]
//====================================协商缓存示例===================================

// 从数据库查询数据
const getDBQuery = () => {
   return {
      data: {
         message: 'db data'
      }
   };
};

// 生成基于数据内容的哈希值，用作 ETag，可以改用更加高效的hash函数
const generateETag = (data) => {
   const hash = createHash('sha256');
   hash.update(JSON.stringify(data)); // 用数据内容生成哈希值
   return `"${hash.digest('base64')}"`; // 返回哈希值作为 ETag
};

// API 路由
app.get('/api/data', (req, res, next) => {
   // 获取数据库数据
   const dbData = getDBQuery().data;
   // 生成 ETag 信息，基于数据内容的哈希
   const etag = generateETag(dbData);
   // 设置响应头
   res.setHeader('ETag', etag);
   // 获取请求头中的 If-None-Match
   const ifNoneMatch = req.headers['if-none-match'];
   // 检查 If-None-Match
   if (ifNoneMatch === etag) {
      // 如果数据没有变化，返回 304 Not Modified
      return res.status(304).end();
   }

   // 返回数据
   res.json(dbData);
});
```

:::

<Tip title="提示">
Cache-Control中，public表示任何服务器都可以缓存，而private只能游览器缓存不包含代理服务器，当设置`Cache-Control: no-cache` 则表示**不用强缓存**，当`·`Cache-Control`与`Expires`同时存在时，游览器会以Cache-Control为准
</Tip>

::: code-group

```ts [cacheControl.ts]
//注意
app.get('/api/data', (req, res) => {
   // 获取数据库数据
   const dbData = getDBQuery().data;

   // 强缓存：设置 Cache-Control 和 Expires
   res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时（3600 秒）
   res.setHeader('Expires', new Date(Date.now() + 3600 * 1000).toUTCString()); // 过期时间设置为当前时间 + 1 小时

   // 返回数据
   res.json(dbData);
});
```

:::

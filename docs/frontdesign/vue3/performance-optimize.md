# 性能优化

- **格式优化、懒加载、CDN、代码压缩、请求合并（可以使用es6特性allSettled并发）、以及缓存策略、代码分割、Tree Shaking**

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
      cssCodeSplit: true, //css代码分离
      terserOptions: {
         //具体也可参考 https://terser.org/docs/api-reference/#minify-options
         /**
          * compress 压缩选项
          * format   格式选项
          * mangle   混淆选项
          */
         //@ts-ignore `terser` may not be installed
         compress: {
            drop_console: true, // 删除console
            drop_debugger: true, // 删除调试断点
            arguments: true, // 删除未使用的函数参数
            unused: true, // 删除未使用的变量
            dead_code: true // 删除死代码
         },
         format: {
            comments: false // 删除注释
         },
         mangle: {
            toplevel: true //混淆顶级变量名
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
      optimizationLevel: 3, // 设置 GIF 压缩等级（0-3）
      interlaced: false // 是否进行逐行扫描优化
   },
   optipng: {
      optimizationLevel: 5 // 设置 PNG 压缩等级（0-7）
   },
   mozjpeg: {
      quality: 75 // 设置 JPEG 压缩质量（0-100）
   },
   pngquant: {
      quality: [0.6, 0.8] // 设置 PNG 压缩质量范围
   },
   svgo: {
      plugins: [
         { removeViewBox: false } // 保留视图框
      ]
   },
   webp: {
      quality: 75 // 设置 WebP 图片质量
   }
});
```

## 缓存减少请求

- [local/session]Storage，持久化或会话数据
- 强缓存(Cache-Control /Expires)，只发送一次请求，之前使用缓存，http状态码**200** （from cache）  
  **强缓存又分为内存缓存和硬盘缓存，游览器自动调度，不能自定义**
- 协商缓存，使用变化不确定，或者频繁变化的数据。例如<span class="text-blue-400">API请求</span>。http状态码**304** （Not Modified）  
  <span class="text-red-400">注：需要配对字段一起使用，例如**Last-Modified / If-Modified-Since**和**ETag / If-None-Match**</span>  
  **If-Modified-Since**是上一次修改时间，Last-Modified是最后更改时间，它们适合**静态文件js、ts、img**等。  
  **ETag / If-None-Match**和前者差不多，但是它更适合**动态内容、API数据**等，基于哈希快速计算ETag，精确度高。

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    协商缓存API示例
</summary>

```ts
import express from 'express';
import { createHash } from 'node:crypto';

// 拟从数据库查询数据
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

</details>

**注：** Cache-Control中，public表示任何服务器都可以缓存，而private只能游览器缓存不包含代理服务器，当设置`Cache-Control: no-cache` 则表示不用强缓存，当Cache-Control与Expires同时存在时，游览器会以Cache-Control为准

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    强缓存
</summary>

```ts
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

</details>

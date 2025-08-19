# 性能优化

- **格式优化、懒加载、CDN、代码压缩、请求合并（可以使用es6特性allSettled并发）、以及缓存策略、代码分割、Tree Shaking**

## vite构建优化

使用vite-plugin-inspect监控打包，开启代码压缩、css代码分割和关闭源码映射,以及删除console.log打印,和删除未使用变量、注释和混淆变量。  

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Inspect from "vite-plugin-inspect";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Inspect({
      enabled: true,
      build: true,
      exclude: /node_modules/,
    }),
  ],
  build: {
    minify: "terser", //默认
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
        dead_code: true, // 删除死代码
      },
      format: {
        comments: false, // 删除注释
      },
      mangle: {
        toplevel: true //混淆顶级变量名	
      }
    }
  },
});


```

## 图片压缩

`vite-plugin-imagemin`vite插件为例（还是使用vite）
```ts
//options
ViteImagemin({
      gifsicle: {
        optimizationLevel: 3, // 设置 GIF 压缩等级（0-3）
        interlaced: false, // 是否进行逐行扫描优化
      },
      optipng: {
        optimizationLevel: 5, // 设置 PNG 压缩等级（0-7）
      },
      mozjpeg: {
        quality: 75, // 设置 JPEG 压缩质量（0-100）
      },
      pngquant: {
        quality: [0.6, 0.8], // 设置 PNG 压缩质量范围
      },
      svgo: {
        plugins: [
          { removeViewBox: false }, // 保留视图框
        ],
      },
      webp: {
        quality: 75, // 设置 WebP 图片质量
      }
    })
```
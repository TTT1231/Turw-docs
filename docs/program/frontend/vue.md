---
outline: [2, 3]
---

# Vue

## 核心机制

针对定义对象vue2抛出错误的问题，vue3结合使用**ES6**中的Reflect（对象操作工具箱），  
相比Object.defineProperty()【vue2】成功返回对象，失败抛出错的头疼问题。

该结合Reflect.get/set直接返回true or false这样就让错误处理更加优雅  
提升数据劫持的灵活性和安全性。同时也完美解决了this指向windows或undefined错误。

```js{3}
const obj = { name: 'testname' };
const proxy = new Proxy(obj, {
   //使得receiver始终指向该代理对象proxy,避免指向问题
   get(target, key, receiver) {
      return Reflect.get(target, key, receiver);
   }
});
```

### reactivity

以响应式对象为例，vue一个响应式系统包含所有的响应式对象的集合set  
然后每个响应式对象又包含多个响应式属性  
这个响应式属性其实就是一个装有副作用函数的盒子，  
当依赖发生变化然后指向副作用函数就完成了响应式实现。例如:

```js
// ===== 核心数据结构详解 =====
// 第三层：Dep - 依赖集合（最内层）
// 就是一个装副作用函数的盒子
type Dep = Set<Function>                 // [!code warning]
// 例子：假设有3个副作用函数都用到了 obj.name
const nameDepSet = new Set()             // [!code warning]
nameDepSet.add(effect1)  // 副作用函数1   // [!code warning]
nameDepSet.add(effect2)  // 副作用函数2   // [!code warning]
nameDepSet.add(effect3)  // 副作用函数3   // [!code warning]
// 现在 nameDepSet 就是 obj.name 属性的依赖集合
// 第二层：KeyToDepMap - 属性映射表（中间层）
// 一个对象有多个属性，每个属性都有自己的依赖集合
type KeyToDepMap = Map<string, Dep>     // [!code warning]
// 例子：obj 对象有 name 和 age 两个属性
const objDepsMap = new Map()           // [!code warning]
objDepsMap.set('name', nameDepSet)    // name属性 -> 它的依赖集合  // [!code warning]
objDepsMap.set('age', ageDepSet)      // age属性 -> 它的依赖集合   // [!code warning]
// 第一层：targetMap - 对象映射表（最外层）  
// 全局可能有多个响应式对象，每个对象都有自己的属性映射表
const targetMap = new WeakMap<object, KeyToDepMap>()              // [!code warning]
```

### 重绘 & 回流

当响应式数据发生变化，然后需要实时渲染页面,vue就会发生**重绘**，使得数据能够实时展示。  
而**回流**只是css外观风格发生改变，不会受到响应式数据的影响。

### 消除异步

核心针对**异步源头中的Promise**将异步转化同步，以此来消除异步传染性。

::: warning
但是会使的同步代码逻辑执行两次。也即第一段同步代码执行到目标【异步改同步】直接抛出promise中断同步执行队列,第二段重新执行同步代码,此时这里已经出结果了，就屏蔽了异步特性
:::

::: code-group-fold line-numbers

```ts [demo.ts]
//Promise缓存
const cache: {
   status: 'pending' | 'fulfilled' | 'rejected';
   data: any;
} = {
   status: 'pending',
   data: null
};

//当前正在进行的Promise
let currentPromise: Promise<any> | null = null;

//异步源头，转化同步代码===========主要解决这里========= // [!code warning]
function asyncToSync() {
   const targetRequestPromise = () => $fetch('example', { method: '[target]' }); //nuxt

   if (cache.status === 'fulfilled') {
      return cache.data;
   }

   if (cache.status === 'pending') {
      //当前没有promise在进行
      if (!currentPromise) {
         currentPromise = targetRequestPromise()
            .then((res) => {
               cache.status = 'fulfilled';
               cache.data = res.data;
               currentPromise = null;
            })
            .cache((error) => {
               cache.status = 'rejected';
               cache.data = err ?? new Error('Unknown error');
               currentPromise = null;
            });
      }

      //已有promise，直接抛出错误，交给外层cache执行
      throw currentPromise;
   }

   //请求失败了,下次请求失败后续都会抛出这个错误，除非重置cache。
   // 注：由于这里是同步在这做请求重试会死循环
   if (cache.status === 'rejected') {
      throw cache.data;
   }
}

function callSync() {
   return asyncToSync();
}

function main() {
   try {
      console.log('run main');
      const data = callSync();
   } catch (error) {
      if (error instanceof Promise) {
         error.finally?.(() => {
            main();
         });
      } else {
         //返回了不是promise错误对象，请求失败
         //=========可以在这做请求重试===========
         //if-else判断即可，但是注意重置缓存状态
      }
   }
}
```

:::

### slot

::: code-group

```vue [Qwe.vue]
<template>
   <slot greet="hi hello" />
   <slot reply="yes you too" name="named slot" />
</template>
```

```vue [Base.vue]
<template>
   <Qwe>
      <template #eric>
         <h3>这是来自 App 组件的具名插槽内容</h3>
      </template>
      <template #default="slotProps">
         <div>这是默认内容{{ slotProps.greet }}</div>
      </template>
   </Qwe>
</template>
```

:::

::: info 通知
**第一阶段**，App.vue渲染时会将上诉的`template #default`生成一个h函数，这个函数参数就是`slotProps.nihao`交给Qwe.vue

**第二阶段**，Qwe.vue开始渲染，拿出`greet`参数进行传递，然后执行该h函数，生成dom节点

**第三阶段**，生成DOM树，渲染内容
:::

## router

::: tip 提示
Hash:带#不美观，部署简单，刷新能正确加载

history模式，干净标准的url，直接访问子路由会404，需要配置try_files(刷新会报404)在nginx情况下
:::

vue-router做权限控制可以对路由中meta元信息进行类型拓展，这里可以自定义角色和权限。例如:

```js
declare module 'vue-router' {
  interface RouteMeta {
    // 基础属性
    title?: string
    requiresAuth: boolean
    // 权限相关,按钮权限等等
    permissions?: string[]
    // 布局控制
    layout?: 'default' | 'admin'
    // SEO 相关
    metaTags?: {
      name: string
      content: string
    }[]
  }
}

```

## env & proxy

主要介绍vue中环境变量，以及使用的代理问题。

- .env全局默认环境变量，所有环境都会被加载，相同变量会被其他环境变量覆盖（也即如果.env和开发环境和生产环境只要有一个相同就会被覆盖掉，因为其首先加载）。
- .env.development开发环境变量，仅仅在使用pnpm run dev或vite时加载
- .env.production生成环境变量，仅打包代码pnpm run build时加载

::: code-group

```ts [vite.config.ts]
//这里是vite中的代理，主要将javaserver代理到目标
//这里是开发环境，在生产环境中没有效果需要使用nginx进行代替
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
   plugins: [vue()],
   server: {
      proxy: {
         '/javaserver': {
            target: 'http://127.0.0.1:7002',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/javaserver/, '')
         }
      }
   }
});
```

```sh [nginx.conf]
# vite打包后，proxy配置不会生效，需要在Nginx中配置/javaserver转发规则，
# 代替vite中proxy使得请求进行转发。
server {
  # API 代理 - 不需要 CORS！
  location /javaserver/ {
    proxy_pass http://127.0.0.1:7002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    rewrite ^/javaserver/(.*)$ /$1 break;
   }
}
```

:::

::: danger 危险
代理的核心作用就是避免`CORS`问题，而不是解决`CORS`问题

因此当开启代理之后，就不需要再`Nginx`中启用`CORS`，因为这里`vite`作为了中转站点，因此这里是一个同源请求转发。

因此实践中如果是网关的话，只需统一经过网关，然后网关转发即可，此时也是不需要`CORS`，和配置`vite`请求转发，然后nginx配置代理类似。
:::

反向代理就是代理服务器地址，充当中间商，隐藏真实的服务器地址，特别适合防范ddos攻击等。

::: code-group-fold line-numbers

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
   plugins: [vue()],
   //[!code ++]
   server: {
      proxy: {
         '/api': {
            target: 'your-example.ip', // 动态设置代理目标
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 添加更多配置选项
            configure: (proxy) => {
               //目标服务不可用情况
               proxy.on('error', (err) => {
                  console.log('❌ 代理错误:', err.message);
               });
               //代理请求发出前，一般记录请求日志/修改请求头
               proxy.on('proxyReq', (proxyReq, req) => {
                  console.log('📤 代理请求:', req.method, req.url, '→', proxyTarget);
               });
               //收到响应后，一般记录响应日志/修改响应数据
               proxy.on('proxyRes', (proxyRes, req) => {
                  console.log('📥 代理响应:', proxyRes.statusCode, req.url);
               });
            }
         }
      }
      //[!code ++]
   }
});
```

:::

## 性能优化

::: tip 提示
格式优化、懒加载、CDN、代码压缩、请求合并（可以使用es6特性allSettled并发）、以及缓存策略、代码分割、Tree Shaking
:::

### 构建优化

使用vite-plugin-inspect监控打包，开启代码压缩、css代码分割和关闭源码映射,以及删除console.log打印,和删除未使用变量、注释和混淆变量。

::: code-group-fold line-numbers

```ts [demo.ts]
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

:::

### 图片压缩

`vite-plugin-imagemin`vite插件为例（还是使用vite）

::: code-group-fold line-numbers

```ts [demo.ts]
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

:::

### 缓存策略

#### 缓存方式对比

| 方式            | 存储位置   | 状态码               | 使用场景       | 说明                                              |
| --------------- | ---------- | -------------------- | -------------- | ------------------------------------------------- |
| **Storage API** | 浏览器本地 | -                    | 持久化数据     | 包括 localStorage（永久）、sessionStorage（会话） |
| **强缓存**      | 内存/硬盘  | `200 (from cache)`   | 不变的静态资源 | 浏览器自动调度，不可自定义                        |
| **协商缓存**    | 服务器验证 | `304 (Not Modified)` | 变化的动态资源 | 需要与服务器验证                                  |

#### 协商缓存策略

##### Last-Modified / If-Modified-Since

- **适用于** - 静态文件（JS、TS、IMG、CSS 等）
- **原理** - 对比文件修改时间
- **精确度** - 中等（以秒为单位）

##### ETag / If-None-Match

- **适用于** - 动态内容、API 数据
- **原理** - 基于内容哈希计算，变化即改变
- **精确度** - 高（内容级别）

::: tip 提示
两种方式可配对使用，服务器会根据 `If-Modified-Since` 或 `If-None-Match` 判断资源是否变化
:::

::: code-group-fold line-numbers

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

::: tip 提示
Cache-Control中，public表示任何服务器都可以缓存，而private只能游览器缓存不包含代理服务器，当设置`Cache-Control: no-cache` 则表示**不用强缓存**，当`·`Cache-Control`与`Expires`同时存在时，游览器会以Cache-Control为准
:::

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

## Vite

冷启动、按需加载模块、热更新、高效`Rollup`打包。

### 动态路由

采用`import.meta.glob`方式，其是一个异步导入函数（懒加载函数），只有当路由真正被访问的时候，才会去加载对应组件文件。

#### 示例

假设我菜单路由如下:

::: code-group-fold line-numbers

```json [demo.json]
[
   {
      "path": "/main",
      "name": "main",
      "component": "MainForm",
      "meta": {
         "ishome": true
      },
      "children": [
         {
            "path": "home",
            "name": "home",
            "children": [
               {
                  "path": "analysis",
                  "name": "analysis",
                  "component": "sys/home/Analysis"
               },
               {
                  "path": "workbench",
                  "name": "workbench",
                  "component": "sys/home/WorkBench",
                  "meta": {
                     "ishide": true
                  }
               }
            ]
         },
         {
            "path": "/:patchMatch(.*)",
            "name": "error",
            "component": "error/Error"
         },
         {
            "path": "systemanager",
            "name": "systemanager",
            "children": [
               {
                  "path": "usermanager",
                  "name": "usermanager",
                  "component": "sys/systemanager/UserManager"
               },
               {
                  "path": "menumanager",
                  "name": "menumanager",
                  "component": "sys/systemanager/MenuManager"
               }
            ]
         },
         {
            "path": "fun",
            "name": "fun",
            "children": [
               {
                  "path": "shotscreen",
                  "name": "shotscreen",
                  "component": "sys/fun/ShotScreen"
               },
               {
                  "path": "commontable",
                  "name": "commontable",
                  "component": "sys/fun/CommonTable"
               }
            ]
         }
      ]
   }
]
```

:::

#### 动态导入组件的原理

`import.meta.glob` 返回一个对象，其中：

- **键（key）** - 文件路径（相对路径）
- **值（value）** - 异步导入函数（懒加载函数）

通过递归函数遍历路由配置，将组件字符串转换为异步导入函数，实现动态加载。

::: tip 提示
**文件位置和名字需要约定**，保证 `components` 对象中的路径能正确对应到实际组件文件
:::

##### 实现示例

::: code-group-fold line-numbers

```ts [demo.ts]
//[!code highlight]
// 1. 使用 import.meta.glob 导入所有组件
const components = import.meta.glob('../../views/**/*.vue');

//[!code highlight]
// 2. 递归处理路由，将组件字符串替换为导入函数
function recurseAddRoutes(routes: RoutesType[]) {
   return routes.map((route) => {
      // 如果有组件配置，获取对应的导入函数
      if (route.component && route.component !== '') {
         route.component = components[`../../views/${route.component}.vue`];
      }

      // 递归处理子路由
      if (route.children?.length > 0) {
         route.children = recurseAddRoutes(route.children);
      }

      return route;
   });
}
```

:::

### devtools

::: code-group

```sh:no-line-numbers [install.sh]
pnpm add vite-plugin-vue-devtools -D
```

```ts [usage.ts]
import vueDevTools from 'vite-plugin-vue-devtools'; //[!code ++]

export default defineConfig({
   plugins: [
      vueDevTools() //[!code ++]
   ]
});
```

:::

**增强提示（类型安全）**

```js
/// <reference types="vite/client" /> //[!code ++]
//加上上面那个进行类型提示增强
//需要在tsconfig.app.json配置`"types": ["vite/client"]` // [!code warning]
interface ImportMeta {
   readonly env: ImportMetaEnv; //这个ImportMetaEnv这个是自定义的
}
```

全部放在一个文件也是可以的，例如下面这段代码:

```ts
/// <reference types="vite/client" />

interface MyEnvType {
   qwe: string;
}

declare global {
   interface ImportMetaEnv extends MyEnvType {}

   interface ImportMeta {
      readonly env: ImportMetaEnv;
   }
}

export {};
```

::: tip 提示
这里其实也可以不用导入这个`.d.ts`，定义全局类型也是一样的，或者`import type`,然后该声明文件会变为局部声明文件，使用`export {}` 导出，变为全局声明文件也是一样可以的。
:::

### env tip

在环境变量验证中，不能将

```ts
interface ImportMetaEnv extends Record<ImportMetaEnvFallbackKey, any> {
   BASE_URL: string;
   MODE: string;
   DEV: boolean;
   PROD: boolean;
   SSR: boolean;
}
```

其中的BASE_URL，MODE，DEV，PROD，SSR属性移除掉组合一个新类型，例如`type newType = Omit<ImportMetaEnv,'BASE_URL',...>`这时ts会推断不出来全局拓展的环境变量，也就没有了类型安全。

> [!IMPORTANT]
> 解决方案就是**保留它**，在需要的验证的地方例如`zod`中scheme只针对特定的变量进行验证，
> parse验证时直接将`import.meta.env`进行解构赋值即可

> [!WARNING]
> 如果想在vite启动时就对环境变量进行验证，使得验证不通过应用程序直接终止，那么就需要在`vite.config.ts`文件中在defineConfig进行验证，缺点就是要**手动加载环境变量**，vite不会自动处理，如下:

```ts
//vite.config.ts
export default defineConfig(({mode})=>{
   //手动加载环境变量,env-> Record<string,string>
   const env = loadEnv(mode,process.cwd().'path-to-envfile')//.env,.env*

   //validate env config
   validateEnv(env)

   return {
      plugins:[
         vue()
      ]
   }

})
```

为保障类型安全需手动定义相关类型，但易出现重复定义情况（例如在 `env.d.ts` 中拓展 `ImportMeta` 全局类型时，可能与其他位置类型冲突）。

::: tip 提示
解决方案是将所需的 `envConfig` 直接定义为全局类型，再嵌入 `ImportMeta` 中，`vite.config.ts` 可直接使用，既避免重复定义，也解决了多位置维护类型的问题。
:::

::: tip
上诉中这个`ImportMeta`是自定义的环境变量类型
:::

```ts
//这是全局类型，这里是局部类型定义
type RequiredEnv = {
   VITE_API_BASE_URL: string;
};
type ViteEnv = RequiredEnv & Record<string, string>;

//类型安全，这是env.VITE_API_BASE_URL就会有类型提示了
const env = loadEnv(mode, process.cwd(), '') as ViteEnv;
```

这种手动没有vite自动加载BASE_URL，MODE，DEV，PROD，SSR属性，如果要对其进行验证就需要手动完成vite的这个功能。

## Uniapp

在 uni-app 微信小程序中使用环境变量时，直接使用 `import.meta.env.VITE_XXX` 会返回 `undefined`。
uni-app 小程序端使用自己的编译流程，Vite 默认不会自动将 `.env` 文件中的变量注入到小程序代码中。

因此需要手动加载环境变量并通过`define`注入，同时还要替换整个env对象，然后就可以用`import.meta.env`访问了。

```ts
import { defineConfig, loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig(({ mode }) => {
   const env = loadEnv(mode, process.cwd());

   return {
      plugins: [uni()],
      define: {
         // 关键：替换整个 import.meta.env 对象
         'import.meta.env': JSON.stringify({
            VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
            VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY
            // 添加更多环境变量...
         })
      }
   };
});
```

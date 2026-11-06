---
outline: [2, 3]
---

# Vue

## 核心机制

Vue 3 使用 `Proxy` 拦截响应式对象的属性访问和修改，并在读取时收集依赖、修改时触发相关更新。`ref` 则通过 `.value` 的 getter 和 setter 跟踪访问。

使用 `Reflect.get` 时传入 `receiver`，可以保留 getter 的接收者语义：

```js
const obj = { name: 'testname' };
const proxy = new Proxy(obj, {
    get(target, key, receiver) {
        return Reflect.get(target, key, receiver);
    }
});
```

### reactivity

可以用三层结构理解依赖关系：对象 → 属性 → 依赖这个属性的副作用。读取属性时收集当前副作用，修改属性时通知订阅者。下面是概念模型，不是 Vue 内部实现的完整代码：

```ts
type Dep = Set<Function>;
type KeyToDepMap = Map<PropertyKey, Dep>;
const targetMap = new WeakMap<object, KeyToDepMap>();
```

例如，两个副作用都读取 `state.name`，它们都会订阅这个属性；更新 `state.name` 时，响应式系统会通知它们。

### 重绘 & 回流

响应式数据变化会触发相关更新；浏览器是否需要布局或绘制，取决于最终修改了哪些 DOM 和样式：

- **回流（布局）**：需要重新计算元素的尺寸或位置，例如修改宽度。
- **重绘**：外观需要更新，例如修改颜色；不一定需要重新布局。

一次更新可能触发布局和绘制，也可能不会产生可见的 DOM 变化。

### 消除异步

异步操作不能真正变成同步操作。下面的示例通过缓存结果和抛出待处理的 Promise，让调用方在请求完成后重新执行；这种模式需要专门的调度机制支持。

::: warning 注意
重试会再次执行等待点之前的同步代码，因此这些代码应避免不可重复的副作用。普通业务请求通常直接使用 `async` / `await` 更清晰。
:::

::: code-group-fold line-numbers

```ts [demo.ts]
type State =
    | { status: 'pending'; promise: Promise<void> }
    | { status: 'fulfilled'; data: unknown }
    | { status: 'rejected'; error: unknown };

let state: State | undefined;

function readData(): unknown {
    if (!state) {
        const promise = fetch('/api/data')
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(
                (data) => {
                    state = { status: 'fulfilled', data };
                },
                (error) => {
                    state = { status: 'rejected', error };
                }
            );
        state = { status: 'pending', promise };
    }

    if (state.status === 'pending') throw state.promise;
    if (state.status === 'rejected') throw state.error;
    return state.data;
}

function render() {
    try {
        console.log(readData());
    } catch (value) {
        if (value instanceof Promise) value.then(render, render);
        else console.error(value);
    }
}

render();
```

:::

### slot

::: code-group

```vue [Qwe.vue]
<template>
    <slot greet="hi hello" />
    <slot reply="yes you too" name="reply" />
</template>
```

```vue [Base.vue]
<template>
    <Qwe>
        <template #reply="slotProps">
            <h3>具名插槽：{{ slotProps.reply }}</h3>
        </template>
        <template #default="slotProps">
            <div>这是默认内容{{ slotProps.greet }}</div>
        </template>
    </Qwe>
</template>
```

:::

父组件提供插槽内容，子组件渲染 `<slot>` 时传入插槽属性。上例中，默认插槽读取 `greet`，具名插槽 `reply` 读取 `reply`。

## router

Hash 模式使用 URL 中的 `#`，静态部署通常较简单。History 模式的 URL 更简洁，但直接访问子路由时服务器需要回退到应用入口，否则可能返回 404。

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

Vite 按模式加载环境变量：`.env` 在所有模式下加载，`.env.development` 和 `.env.production` 分别用于对应模式；模式专属文件中的同名变量优先。也可以通过 `--mode` 指定其他模式。

客户端代码只能直接访问配置前缀（默认 `VITE_`）的变量，这些值会进入客户端产物，不要存放密钥。

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
  # 浏览器通过同源路径访问 API
  location /javaserver/ {
    proxy_pass http://127.0.0.1:7002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   }
}
```

:::

如果浏览器向同源地址发送请求，再由服务器转发到后端，浏览器看到的是同源请求，通常不需要对这条请求配置 CORS。若浏览器实际访问的是不同源的网关或 API，仍需由目标服务正确配置 CORS。

Vite 的开发代理只在开发服务器中生效；生产环境需要由 Web 服务器或网关配置转发。反向代理也可统一入口和隐藏源站，但不能单独防御 DDoS。

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
                target: 'http://127.0.0.1:7002',
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
                        console.log('📤 代理请求:', req.method, req.url);
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

先通过性能指标定位瓶颈，再按需选择图片格式与尺寸、非关键资源懒加载、CDN、缓存、代码分割和 tree shaking。并发请求可以减少等待时间，但不会自动合并请求。

### 构建优化

使用 `vite-plugin-inspect` 检查插件转换过程；按需配置压缩、CSS 分割和 source map。删除日志或混淆代码前，应确认不会影响排障与运行行为。

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
        minify: 'terser', // 需要安装 terser
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

以下以 `vite-plugin-imagemin` 为例，按图片类型调整压缩参数，并检查画质是否满足需求：

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

| 方式        | 存储位置                 | 状态码                    | 使用场景                 | 说明                                                   |
| ----------- | ------------------------ | ------------------------- | ------------------------ | ------------------------------------------------------ |
| Storage API | 浏览器本地               | -                         | 应用主动存取的数据       | `localStorage` 跨会话；`sessionStorage` 随页面会话结束 |
| 强缓存      | 浏览器缓存               | 常见为 `200 (from cache)` | 可在一段时间内复用的资源 | 通过 `Cache-Control` 等响应头控制                      |
| 协商缓存    | 浏览器缓存，向服务器验证 | 未变化时 `304`            | 需要确认是否更新的资源   | 可使用 ETag 或修改时间验证                             |

#### 协商缓存策略

##### Last-Modified / If-Modified-Since

- **适用于** - 静态文件（JS、TS、IMG、CSS 等）
- **原理** - 对比文件修改时间
- **精确度** - 中等（以秒为单位）

##### ETag / If-None-Match

- **适用于** - 需要验证版本的静态或动态资源
- **原理** - 服务器提供资源版本标识；可以基于内容生成，也可以由其他版本信息生成
- **精确度** - 取决于服务端如何生成标识

两种验证方式可以配合；同时存在时，支持 ETag 的服务器通常优先处理 `If-None-Match`。

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

`Cache-Control: public` 允许共享缓存存储响应；`private` 限制共享缓存存储。`no-cache` 允许存储，但复用前必须验证；需要禁止存储时使用 `no-store`。`max-age` 与 `Expires` 同时存在时，`max-age` 优先。

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

Vite 在开发时按需提供模块并支持热更新，在生产时构建可部署的资源。构建工具和配置选项会随 Vite 版本变化，应以项目版本为准。

### 动态路由

`import.meta.glob` 默认返回路径到异步导入函数的映射。把对应函数交给路由配置，就可以在访问路由时加载组件。

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

组件路径需要与 `components` 中的键保持一致，否则无法找到对应的导入函数。

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

在模块化的 `.d.ts` 文件中，可以通过 `declare global` 扩展全局类型；`export {}` 确保文件被视为模块。

### env tip

环境变量需要分别考虑类型提示和运行时验证。Vite 提供 `BASE_URL`、`MODE`、`DEV`、`PROD` 和 `SSR` 等内置字段；应用变量可以通过扩展 `ImportMetaEnv` 提供类型提示，再使用验证工具检查实际值。

如果需要在 Vite 启动时验证环境变量，可以在配置中使用 `loadEnv` 手动加载，再交给验证函数：

```ts
// vite.config.ts：validateEnv 由应用自行实现
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { validateEnv } from './env-validation';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    validateEnv(env);
    return { plugins: [vue()] };
});
```

可以为应用需要的环境变量维护共享类型，再分别用于客户端声明和配置文件。类型断言不会执行运行时验证，仍需对实际读取的值做校验。

```ts
// 示例：在配置文件中描述需要读取的变量
type RequiredEnv = {
    VITE_API_BASE_URL: string;
};
type ViteEnv = RequiredEnv & Record<string, string>;

// 断言只提供类型提示，不会验证变量是否存在
const env = loadEnv(mode, process.cwd(), '') as ViteEnv;
```

`loadEnv` 返回加载到的环境变量；`import.meta.env` 中的 Vite 内置字段不等同于这些文件变量。

## Uniapp

uni-app 不同版本和目标平台的环境变量处理可能不同。如果小程序端无法读取预期变量，可以先检查构建模式与变量前缀；以下示例展示如何在配置中加载并显式注入所需值。注入到客户端的值不是秘密。

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

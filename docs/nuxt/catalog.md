# Nuxt目录

::: code-group

<!-- prettier-ignore-start -->
```md [catalog.md]
📂 my-nuxt-app/
   📂 app/
      📂 assets/         // 存放静态资源文件，构建工具处理后会交给浏览器
      📂 components/     // Vue组件，自动导入无需手动import，支持异步
      📂 composables/    // 类似Vue中hooks
      📂 layouts/        // 页面布局，主要包裹页面的外层框架，其中slot会明确内容插入位置
      📂 middleware/     // 类似Node.js路由中间件，可在此进行权限校验或导航前执行代码
      📂 pages/          // Vue Router自动生成路由，动态路由按pages/users/[id].vue格式定义
      📂 plugins/        // 存放Nuxt插件，扩展Vue/Nuxt，应用启动时自动运行
      📂 utils/          // 工具函数
      📄 app.vue         // 主入口组件，类似Vue中App.vue
      📄 app.config.ts   // 应用运行时配置，主要定义应用访问公共变量
     📄 error.vue       // 错误页面组件，类似Vue中404路由组件
   📂 content/           // 存放内容目录，适用于博客、文档等内容型网站
   📂 public/            // 直接提供给客户端的静态文件，不被构建工具处理，通过/根路径访问
   📂 shared/            // 存放前后端共享代码，如类型定义、常量、枚举等
   📂 server/            // 服务器目录
      📂 api/            // API路由映射文件
        📄 hello.ts     // 映射到/api/hello可直接访问（示例）
      📂 middleware/     // 服务器请求拦截，用于访问日志、鉴权等（示例）
        📄 auth.ts      // 鉴权逻辑（示例）
      📂 plugins/        // 服务器插件，拓展Nuxt服务端功能（如注册数据库、三方库）
        📄 myPlugin.ts  // 插件定义逻辑（示例）
      📂 utils/          // 服务端工具函数
        📄 db.ts        // 数据库工具参数（如连接、查询，示例）
     📄 index.ts        // 服务器入口文件，仅需对启动过程处理时使用（大部分场景无需）
  📄 nuxt.config.ts     // 配置整个Nuxt应用行为
```
<!-- prettier-ignore-end -->

:::

## 自动引入规制和类型提示

**components**——组件自动引入包括**类型**（要将项目运行起来，依赖文件系统）能根据自动嵌套目录结构生成组件名称。

例如`components/base/Button.vue → BaseButton`也可以自定义：

```js
 // 自动导入，识别配置(示例配置) // [!code warning]
 {
    path: '~/components/base',      //路径
    prefix: 'Base',               //前缀
    ignore: ['**/*.stories.ts']  // 忽略特定文件
 },
```

**composables**——hooks自动引入包括**类型**（要将项目运行起来，依赖文件系统）能根据自动嵌套目录结构处理。

例如`composables/auth/login.ts → useLogin()`

### 其它自动导入（需要特殊配置或手动导入）

#### Plugins

- **自动注册执行**（依赖文件系统，项目运行时识别）
- **用途**：注入全局方法、指令等
- **使用方式**：通过 `useNuxtApp()` 解构获取
   ```ts
   const { $myMethod } = useNuxtApp();
   ```
- **文件约定**：
   - `plugins/my-plugin.client.ts` — 仅客户端（浏览器）
   - `plugins/my-plugin.server.ts` — 仅服务端（服务器）

#### Pinia Stores

- **位置**：~/stores/
- **需求**：安装 `@pinia/nuxt`
- **类型提示**：完整类型提示 :smiley:
- **使用方式**：需手动导入
   ```ts
   import { useUserStore } from '@/stores';
   ```

#### API 路由

- **位置**：~/server/api/
- **类型提示**： $fetch 有完整类型支持 :smiley:
- **扩展**：可封装 axios 并提供类型定义

#### 中间件

- **位置**：~/middleware/
- **特性**：文件自动注册，无需手动导入 :smiley:

#### 布局

- **位置**：~/layouts/
- **特性**：文件自动识别 :smiley:
- **使用方式**：通过 `<NuxtLayout name="custom">` 组件使用
- **注意**：props 需手动声明

#### 页面

- **位置**：~/pages/
- **特性**： 路由自动生成 :smiley:
- **动态路由**：支持 `[id].vue` 格式

## 文件命名

[order].[name].[env].[type].ts

- order 执行顺序，一般用01，02...表示，其中01第一个执行,其次02。
- name 名字
- env 作用环境有**server、client、global**表示服务端、客户端、全局。
- type 文件类型可以是plugin、middleware等

## 服务端 Hooks（Nitro）

### 核心 Runtime Hooks

| Hook 名称         | 触发时机                                                     |
| ----------------- | ------------------------------------------------------------ |
| `request`         | 收到请求时触发（处理日志、鉴权等）                           |
| `beforeResponse`  | 响应发送前（可修改 body 和 headers）                         |
| `afterResponse`   | 响应发送后（做清理、记录等）                                 |
| `render:response` | SSR 页面渲染完成、响应发送前（**这里可以做注入csp中nonce**） |
| `render:html`     | 构建 HTML 前（SSR 流程中）                                   |
| `error`           | 请求或渲染出错时触发                                         |
| `close`           | Nitro 进程关闭时触发                                         |
| `dev:ssr-logs`    | 开发模式下 SSR 日志输出时                                    |

---

## 客户端 Hooks

### Nuxt App Hooks（`nuxtApp.hooks`）

| Hook 名称            | 触发时机                                                            |
| -------------------- | ------------------------------------------------------------------- |
| `app:created`        | Nuxt 应用实例创建后（Vue app 未挂载）                               |
| `app:beforeMount`    | Vue 应用挂载到 DOM 前                                               |
| `app:mounted`        | Vue 应用挂载完成（hydration 完成）                                  |
| `app:rendered`       | 首次渲染完成（包含 SSR hydration）                                  |
| `app:error`          | 应用运行时抛出错误                                                  |
| `vue:error`          | **Vue 应用运行时抛出错误**（等价于 `app.config.errorHandler` 捕获） |
| `page:start`         | 页面导航开始（路由切换开始）                                        |
| `page:finish`        | 页面导航完成（页面和数据就绪）                                      |
| `page:loading:start` | 页面数据开始加载                                                    |
| `page:loading:end`   | 页面数据加载完成                                                    |

### Router Hooks（`vue-router`）

| Hook 名称       | 触发时机           |
| --------------- | ------------------ |
| `beforeEach`    | 路由跳转前         |
| `beforeResolve` | 目标路由解析完成前 |
| `afterEach`     | 路由跳转后         |

---

## Nuxt类型增强提示

### env类型增强（process.env）

定义一个.d.ts类型文件，重写ProcessEnv接口。例如：定义之后，可能不会自动导入，在**nuxt.config.ts**顶部引入ts类型。

<Tip title="提示">
这里其实也可以不用导入这个`.d.ts`，定义全局类型也是一样的，或者`import type`,然后该声明文件会变为局部声明文件，使用`export {}` 导出，变为全局声明文件也是一样可以的。
</Tip>

```ts
//下面这段ts类型需要在nuxt.config.ts顶部引入，类似ts import [!code ++]
/// <reference path="./path-to/[custom-name].d.ts" />

// [custom-name].d.ts
declare namespace NodeJS {
   interface ProcessEnv {
      //字段提示
   }
}
```

### event类型增强提示（event.context）

直接声明即可nuxt会自动完成导入。

```ts
//[custom-name].d.ts
declare module 'h3' {
   interface H3EventContext {
      //字段拓展,ts提示
      //这里可以增加自己需要的类型 //[!code warning]
   }
}
```

### useRuntimeConfig类型增强提示

```ts
//[custom-name].d.ts
import 'nuxt/schema';

declare module 'nuxt/schema' {
   interface RuntimeConfig {
      //字段拓展,ts提示
      //这里可以增加自己需要的类型 //[!code warning]
   }
}

//上面这个文件类型不会自动引入，在nuxt.config.ts引入一下即可，参考下面这段代码
/// <reference path="./path-to/[custom-name].d.ts" />
```

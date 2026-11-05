---
outline: [2, 3]
---

# Nuxt

## 目录

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

### 引入机制

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

#### 其它自动导入（需要特殊配置或手动导入）

##### Plugins

- **自动注册执行**（依赖文件系统，项目运行时识别）
- **用途**：注入全局方法、指令等
- **使用方式**：通过 `useNuxtApp()` 解构获取
    ```ts
    const { $myMethod } = useNuxtApp();
    ```
- **文件约定**：
    - `plugins/my-plugin.client.ts` — 仅客户端（浏览器）
    - `plugins/my-plugin.server.ts` — 仅服务端（服务器）

##### Pinia Stores

- **位置**：~/stores/
- **需求**：安装 `@pinia/nuxt`
- **类型提示**：完整类型提示 :smiley:
- **使用方式**：需手动导入
    ```ts:no-line-numbers
    import { useUserStore } from '@/stores';
    ```

##### API 路由

- **位置**：~/server/api/
- **类型提示**： $fetch 有完整类型支持 :smiley:
- **扩展**：可封装 axios 并提供类型定义

##### 中间件

- **位置**：~/middleware/
- **特性**：文件自动注册，无需手动导入 :smiley:

##### 布局

- **位置**：~/layouts/
- **特性**：文件自动识别 :smiley:
- **使用方式**：通过 `<NuxtLayout name="custom">` 组件使用
- **注意**：props 需手动声明

##### 页面

- **位置**：~/pages/
- **特性**： 路由自动生成 :smiley:
- **动态路由**：支持 `[id].vue` 格式

### 文件命名

[order].[name].[env].[type].ts

- order 执行顺序，一般用01，02...表示，其中01第一个执行,其次02。
- name 名字
- env 作用环境有**server、client、global**表示服务端、客户端、全局。
- type 文件类型可以是plugin、middleware等

### Nitro Hooks

#### 核心 Runtime Hooks

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

### 客户端 Hooks

#### Nuxt App Hooks（`nuxtApp.hooks`）

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

#### Router Hooks（`vue-router`）

| Hook 名称       | 触发时机           |
| --------------- | ------------------ |
| `beforeEach`    | 路由跳转前         |
| `beforeResolve` | 目标路由解析完成前 |
| `afterEach`     | 路由跳转后         |

---

### 类型增强

#### env类型增强（process.env）

定义一个.d.ts类型文件，重写ProcessEnv接口。例如：定义之后，可能不会自动导入，在**nuxt.config.ts**顶部引入ts类型。

::: tip 提示
这里其实也可以不用导入这个`.d.ts`，定义全局类型也是一样的，或者`import type`,然后该声明文件会变为局部声明文件，使用`export {}` 导出，变为全局声明文件也是一样可以的。
:::

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

#### event类型增强提示（event.context）

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

#### useRuntimeConfig类型增强提示

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

## 错误处理

对nuxt应用所发生的错误进行统一集中处理。

### 应用级

<nuxterror-handling showImg='APP-ERROR'/>

### 前后端分离

<nuxterror-handling showImg='FRONTEND-ERROR'/>

### 分层架构

<nuxterror-handling showImg='LAYERS-STRUCT'/>

## SEO & SSR

### 核心概念

**SEO（搜索引擎优化）**  
让搜索引擎和爬虫更容易获取页面的内容

**SSR（服务端渲染）**  
提高首屏加载速度，避免 SPA 中首屏白屏问题

### SEO

::: tip 提示
**类比理解：网站 = 实体店**

- **head** = 店面招牌（显示在搜索引擎列表）
- **body** = 店内商品（为用户提供最相关、最优质答案）

两者必须相互关联，**光有 body 没有 head 就像论文只有内容没有标题**
:::

---

#### Head 元数据配置

##### 基础元数据

| 标签          | 用途     | 示例                                           |
| ------------- | -------- | ---------------------------------------------- |
| `title`       | 网站标题 | `<title>我的网站</title>`                      |
| `description` | 网站描述 | `<meta name="description" content="...">`      |
| `keywords`    | 关键词   | `<meta name="keywords" content="Vue,Nuxt">`    |
| `author`      | 作者     | `<meta name="author" content="Your Name">`     |
| `robots`      | 爬虫控制 | `<meta name="robots" content="index, follow">` |

##### Robots 指令详解

| 指令                | 含义                         | 适用场景                           |
| ------------------- | ---------------------------- | ---------------------------------- |
| `index, follow`     | 允许收录，并跟踪链接（默认） | 大多数公开页面（如首页、产品页）   |
| `noindex, follow`   | 禁止收录，但跟踪链接         | 临时页面（如测试页、未完成的内容） |
| `index, nofollow`   | 允许收录，但忽略链接         | 免责声明页（链接不传递权重）       |
| `noindex, nofollow` | 禁止收录，且忽略链接         | 隐私页、后台页（完全隐藏）         |

---

##### Open Graph (OG) 协议

> [!NOTE]
> **作用：** 在社交平台分享时显示预览卡片（标题 + 描述 + 图片），而不是纯链接

**核心属性：**

| 属性             | 说明                 | 示例值                                |
| ---------------- | -------------------- | ------------------------------------- |
| `og:title`       | 分享卡片标题         | `我的网站`                            |
| `og:type`        | 内容类型             | `website` / `article` / `video.movie` |
| `og:image`       | 预览图片（需 HTTPS） | `https://example.com/og.jpg`          |
| `og:description` | 简要描述             | `这是一个描述`                        |
| `og:site_name`   | 网站名称             | `My Site`                             |
| `og:locale`      | 语言                 | `zh_CN`                               |

---

##### PWA Manifest

> [!NOTE]
> **作用：** 将网站添加到主屏幕，控制 PWA 视觉表现
>
> **注意：** 需提供多种尺寸图标（PNG 格式）适配不同设备

**配置选项：**

| 选项               | 说明                                                   |
| ------------------ | ------------------------------------------------------ |
| `name`             | 完整名称                                               |
| `short_name`       | 简短名称（空间不足时显示）                             |
| `start_url`        | 启动网址                                               |
| `display`          | `fullscreen` / `standalone` / `minimal-ui` / `browser` |
| `icons`            | 图标数组（多尺寸）                                     |
| `theme_color`      | 主题颜色                                               |
| `background_color` | 启动背景色                                             |
| `orientation`      | 屏幕方向                                               |

---

##### Canonical 链接

::: tip 提示
**解决问题：** Query 参数导致的重复内容困惑

**最佳实践：**

- 有内容时指向自己：`<link rel="canonical" href="当前页面">`
- 无内容时使用 `noindex` 禁止收录

:::

---

##### Robots.txt

::: warning 注意
**作用：** 告诉搜索引擎哪些页面可爬取

**注意：** 这只是"建议"，真正的安全依赖**路由守卫**和**服务端鉴权**
:::

**语法：**

```txt
User-agent: *                    # 适用所有爬虫
Disallow: /admin/*               # 禁止爬取 /admin 目录
Disallow: /api/*                 # 禁止爬取 /api 目录
Allow: /public                   # 允许爬取
Sitemap: https://example.com/sitemap.xml  # 站点地图位置
```

---

#### 全局 SEO 配置示例（Nuxt SEO 模块）

::: details 完整配置示例

```ts
//=================================seo========================================
//某些页面禁止爬虫
robots: {
   UserAgent: '*',
   Disallow: ['/back/*', '/', '/api/*'],
   Sitemap: 'http:/localhost:6002/sitemap.xml',
},
//生成站点地图
sitemap: {
   enabled: true,
   hostname: 'http:/localhost:6002',
   exclude: ['/back/**', '/', '/api/**'],
},

//schema.org 结构化数据,避免每个页面都要写一遍
//主要对head进行强力补充，例如head中属性的关系是什么，还有属性之间的联系
//明确内容类型和关系，解锁富媒体搜索结果
schemaOrg: {
   host: 'https://www.ip.com', // 必须添加 host 属性 //[!code warning]
   identity: {
      '@type': 'Organization',
      name: '组织名',
      url: 'https://www.ip.com',
      logo: 'https://www.ip.com/logo.png',
      contactPoint: {
         //下面@type是对telephone的描述，让搜素引擎更加清楚
         '@type': 'ContactPoint',
         telephone: '+86-123-456-7890',
         contactType: 'customer service',
      },
   },
},

//默认head meta
app: {
   head: {
      title: '网站标题',
         meta: [
            {
               name: 'description',
               content: '描述内容',
            },
            { name: 'keywords', content: '关键词1, 关键词2, ...' },
            { name: 'author', content: '作责' },
            { name: 'robots', content: 'index, follow' },
            //================================分享========================================
            { property: 'og:title', content: '分享标题' },
            {
               property: 'og:description',
               content:
                  '分享描述',
            },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: 'https://www.ip.com' },
            {
               property: 'og:image',
               content: 'https://www.ip.com/og-image.jpg',
            },
      ],
   },
},
```

:::

> [!NOTE]
> 全局的 **head** 和 **schema** 结构化数据都是**全局注入**，应存储基本不变的数据

---

#### Body 内容优化

::: tip 提示
**关系类比：**

- **head** = 目录/索引
- **body** = 实际内容

搜索引擎会根据用户查询匹配 head 和 body，大多数情况下**以 body 为准**（内容为用户服务，head 只是辅助搜索引擎理解）
:::

##### ⚠️ 黑帽 SEO 警告

> [!DANGER]
> **不要这样做：** 为搜索引擎服务而非用户
>
> 违背原则："内容为用户而创造，而非搜索引擎"

::: details 黑帽SEO技术

```html
<!-- SEO 专用内容区域 - 对用户隐藏，但搜索引擎能抓取 -->
<div
    class="seo-content"
    aria-hidden="true"
    style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;"
>
    <h2>产品解决方案 - 字段描述</h2>
    <p>对h2进行描述</p>
    <h3>产品特点</h3>
    <ul>
        <li>产品特点1</li>
        <li>产品特点2</li>
        <li>产品特点3</li>
        <li>产品特点4</li>
    </ul>
    <h3>应用行业</h3>
    <p>应用行业1</p>
</div>
```

:::

::: tip 最佳实践
去掉隐藏，自然编写内容，真诚为用户创造价值

:::

---

#### 页面级别 SEO

##### 类型安全配置

使用 `useSeoMeta` 获得更好的类型提示和安全性

##### 性能优化策略

> [!IMPORTANT]
> **核心目标：** 优化 LCP (最大内容绘制) 和 TTI (可交互时间)
>
> **原理：** 搜索引擎网络带宽有限，优先加载核心关键内容

**实现方式：**

- ✅ 核心脚本和渲染内容**优先**加载
- ⏳ 非关键脚本**延迟**执行
- 🎯 爬虫优先索引核心内容

**方法：** 使用 `tagPosition` 控制脚本执行时机

```ts
<script setup lang="ts">
useHead({
  script: [
    {
      src: 'https://my-unimportant-script.com',
      // 有效选项为：'head' | 'bodyClose' | 'bodyOpen'
      tagPosition: 'bodyClose' //表示当body渲染完后，再执行js脚本等
    }
  ]
})
</script>

```

---

### SSR

#### 基础配置

Nuxt 中启用 SSR 非常简单：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
    ssr: true
});
```

---

#### API 调用最佳实践

::: warning 关键注意事项
SSR + SEO 场景下，必须保证客户端和服务端内容一致，否则**水合阶段会报错**
:::

##### useFetch vs $fetch 选择指南

| 特性         | useFetch         | $fetch                  |
| ------------ | ---------------- | ----------------------- |
| **执行次数** | 仅一次（有缓存） | 两次（服务端 + 客户端） |
| **SSR 友好** | ✅ 是            | ❌ 否                   |
| **适用场景** | 见下方           | 见下方                  |

##### ✅ useFetch 使用场景

- 🔍 **SEO 内容** - 需要搜索引擎抓取
- 📄 **页面主要内容** - 首屏渲染数据
- 🖥️ **需要服务端渲染的数据** - SSR 必需

##### ✅ $fetch 使用场景

- 🖱️ **用户交互触发** - 点击、滚动等事件
- 📝 **表单提交** - 客户端发起的请求
- 💻 **客户端逻辑** - 仅在浏览器执行
- 🔄 **实时数据更新** - 动态 API 调用

::: tip 提示
其他用法两者基本相同，主要区别在于执行时机和缓存策略
:::

## FAQ

主要将nuxt4的项目配置问题和解决方案。

### TS

#### tailwindcss配置问题

> [!tip]
> **不要直接跟随 Tailwind CSS V4 官方文档安装！**
>
> Nuxt 已内置集成 `@nuxt/tailwindcss`。若按 V4 文档操作，`@tailwindcss/vite` 会在 nuxt.config.ts 中产生 TypeScript 类型错误。

**✨ 推荐方案**

使用官方模块 `@nuxt/tailwindcss` + 本地 `tailwind.config.js` 覆盖，实现：

- ✅ 自定义配置
- ✅ 完整类型提示
- ✅ 最简最易维护

**🚀 安装步骤**

**步骤 1：安装依赖**

```sh:no-line-numbers
pnpm add -D @nuxtjs/tailwindcss
```

**步骤 2：配置 nuxt.config.ts**

```ts
export default defineNuxtConfig({
    css: ['~/assets/css/main.css'],
    modules: ['@nuxtjs/tailwindcss']
});
```

**步骤 3：创建 CSS 入口文件**

```css:no-line-numbers
/* ~/assets/css/main.css */
@import 'tailwindcss';
```

**步骤 4：创建 tailwind.config.js 自定义配置**

```js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './components/**/*.{js,vue,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './app.vue',
        './error.vue'
    ],
    theme: {
        extend: {}
    },
    plugins: []
};
```

#### antd 类型问题

> [!NOTE]
> **为什么需要手动配置类型提示？**
>
> Nuxt 采用 TypeScript 项目引用机制：
>
> - `tsconfig.json` 只引用 `.nuxt/tsconfig*.json` 子配置
> - 实际类型检查发生在这些子文件中
> - `.d.ts` 文件在 `app/` 目录下会被自动识别

::: tip 类型声明文件位置建议
**开发流程：** 开发时引入类型文件 → 完成后可删除 → 让 Nuxt 自动处理

即使不配置类型提示，代码依然可运行，但开发环境会：

- ❌ TypeScript 类型推断为 `any`
- ❌ 丧失组件属性提示

**社区实践**：所有 `.d.ts` 类型文件统一放在 `types/` 目录  
**开发方式**：在 `app/` 目录下的 `.d.ts` 文件中直接引入

:::

**✨ 解决方案：全局类型声明**

创建 `.d.ts` 类型文件让 TypeScript 识别即可：

::: details antd类型声明文件

```ts
/* eslint-disable @typescript-eslint/consistent-type-imports */
declare module 'vue' {
    export interface GlobalComponents {
        AAffix: (typeof import('ant-design-vue'))['Affix'];

        AAlert: (typeof import('ant-design-vue'))['Alert'];

        AAnchor: (typeof import('ant-design-vue'))['Anchor'];

        AAnchorLink: (typeof import('ant-design-vue'))['AnchorLink'];

        AAutoComplete: (typeof import('ant-design-vue'))['AutoComplete'];

        AAutoCompleteOptGroup: (typeof import('ant-design-vue'))['AutoCompleteOptGroup'];

        AAutoCompleteOption: (typeof import('ant-design-vue'))['AutoCompleteOption'];

        AAvatar: (typeof import('ant-design-vue'))['Avatar'];

        AAvatarGroup: (typeof import('ant-design-vue'))['AvatarGroup'];

        ABadge: (typeof import('ant-design-vue'))['Badge'];

        ABadgeRibbon: (typeof import('ant-design-vue'))['BadgeRibbon'];

        ABreadcrumb: (typeof import('ant-design-vue'))['Breadcrumb'];

        ABreadcrumbItem: (typeof import('ant-design-vue'))['BreadcrumbItem'];

        ABreadcrumbSeparator: (typeof import('ant-design-vue'))['BreadcrumbSeparator'];

        AButton: (typeof import('ant-design-vue'))['Button'];

        AButtonGroup: (typeof import('ant-design-vue'))['ButtonGroup'];

        ACalendar: (typeof import('ant-design-vue'))['Calendar'];

        ACard: (typeof import('ant-design-vue'))['Card'];

        ACardGrid: (typeof import('ant-design-vue'))['CardGrid'];

        ACardMeta: (typeof import('ant-design-vue'))['CardMeta'];

        ACarousel: (typeof import('ant-design-vue'))['Carousel'];

        ACascader: (typeof import('ant-design-vue'))['Cascader'];

        ACheckableTag: (typeof import('ant-design-vue'))['CheckableTag'];

        ACheckbox: (typeof import('ant-design-vue'))['Checkbox'];

        ACheckboxGroup: (typeof import('ant-design-vue'))['CheckboxGroup'];

        ACol: (typeof import('ant-design-vue'))['Col'];

        ACollapse: (typeof import('ant-design-vue'))['Collapse'];

        ACollapsePanel: (typeof import('ant-design-vue'))['CollapsePanel'];

        AComment: (typeof import('ant-design-vue'))['Comment'];

        AConfigProvider: (typeof import('ant-design-vue'))['ConfigProvider'];

        AStyleProvider: (typeof import('ant-design-vue'))['StyleProvider'];

        ADatePicker: (typeof import('ant-design-vue'))['DatePicker'];

        ADescriptions: (typeof import('ant-design-vue'))['Descriptions'];

        ADescriptionsItem: (typeof import('ant-design-vue'))['DescriptionsItem'];

        ADirectoryTree: (typeof import('ant-design-vue'))['DirectoryTree'];

        ADivider: (typeof import('ant-design-vue'))['Divider'];

        ADrawer: (typeof import('ant-design-vue'))['Drawer'];

        ADropdown: (typeof import('ant-design-vue'))['Dropdown'];

        ADropdownButton: (typeof import('ant-design-vue'))['DropdownButton'];

        AEmpty: (typeof import('ant-design-vue'))['Empty'];

        AForm: (typeof import('ant-design-vue'))['Form'];

        AFormItem: (typeof import('ant-design-vue'))['FormItem'];

        AFormItemRest: (typeof import('ant-design-vue'))['FormItemRest'];

        AImage: (typeof import('ant-design-vue'))['Image'];

        AImagePreviewGroup: (typeof import('ant-design-vue'))['ImagePreviewGroup'];

        AInput: (typeof import('ant-design-vue'))['Input'];

        AInputGroup: (typeof import('ant-design-vue'))['InputGroup'];

        AInputNumber: (typeof import('ant-design-vue'))['InputNumber'];

        AInputPassword: (typeof import('ant-design-vue'))['InputPassword'];

        AInputSearch: (typeof import('ant-design-vue'))['InputSearch'];

        ALayout: (typeof import('ant-design-vue'))['Layout'];

        ALayoutContent: (typeof import('ant-design-vue'))['LayoutContent'];

        ALayoutFooter: (typeof import('ant-design-vue'))['LayoutFooter'];

        ALayoutHeader: (typeof import('ant-design-vue'))['LayoutHeader'];

        ALayoutSider: (typeof import('ant-design-vue'))['LayoutSider'];

        AList: (typeof import('ant-design-vue'))['List'];

        AListItem: (typeof import('ant-design-vue'))['ListItem'];

        AListItemMeta: (typeof import('ant-design-vue'))['ListItemMeta'];

        ALocaleProvider: (typeof import('ant-design-vue'))['LocaleProvider'];

        AMentions: (typeof import('ant-design-vue'))['Mentions'];

        AMentionsOption: (typeof import('ant-design-vue'))['MentionsOption'];

        AMenu: (typeof import('ant-design-vue'))['Menu'];

        AMenuDivider: (typeof import('ant-design-vue'))['MenuDivider'];

        AMenuItem: (typeof import('ant-design-vue'))['MenuItem'];

        AMenuItemGroup: (typeof import('ant-design-vue'))['MenuItemGroup'];

        AModal: (typeof import('ant-design-vue'))['Modal'];

        AMonthPicker: (typeof import('ant-design-vue'))['MonthPicker'];

        APageHeader: (typeof import('ant-design-vue'))['PageHeader'];

        APagination: (typeof import('ant-design-vue'))['Pagination'];

        APopconfirm: (typeof import('ant-design-vue'))['Popconfirm'];

        APopover: (typeof import('ant-design-vue'))['Popover'];

        AProgress: (typeof import('ant-design-vue'))['Progress'];

        AQuarterPicker: (typeof import('ant-design-vue'))['QuarterPicker'];

        ARadio: (typeof import('ant-design-vue'))['Radio'];

        ARadioButton: (typeof import('ant-design-vue'))['RadioButton'];

        ARadioGroup: (typeof import('ant-design-vue'))['RadioGroup'];

        ARangePicker: (typeof import('ant-design-vue'))['RangePicker'];

        ARate: (typeof import('ant-design-vue'))['Rate'];

        AResult: (typeof import('ant-design-vue'))['Result'];

        ARow: (typeof import('ant-design-vue'))['Row'];

        ASelect: (typeof import('ant-design-vue'))['Select'];

        ASegmented: (typeof import('ant-design-vue'))['Segmented'];

        ASelectOptGroup: (typeof import('ant-design-vue'))['SelectOptGroup'];

        ASelectOption: (typeof import('ant-design-vue'))['SelectOption'];

        ASkeleton: (typeof import('ant-design-vue'))['Skeleton'];

        ASkeletonAvatar: (typeof import('ant-design-vue'))['SkeletonAvatar'];

        ASkeletonButton: (typeof import('ant-design-vue'))['SkeletonButton'];

        ASkeletonImage: (typeof import('ant-design-vue'))['SkeletonImage'];

        ASkeletonInput: (typeof import('ant-design-vue'))['SkeletonInput'];

        ASlider: (typeof import('ant-design-vue'))['Slider'];

        ASpace: (typeof import('ant-design-vue'))['Space'];

        ASpaceCompact: (typeof import('ant-design-vue'))['Compact'];

        ASpin: (typeof import('ant-design-vue'))['Spin'];

        AStatistic: (typeof import('ant-design-vue'))['Statistic'];

        AStatisticCountdown: (typeof import('ant-design-vue'))['StatisticCountdown'];

        AStep: (typeof import('ant-design-vue'))['Step'];

        ASteps: (typeof import('ant-design-vue'))['Steps'];

        ASubMenu: (typeof import('ant-design-vue'))['SubMenu'];

        ASwitch: (typeof import('ant-design-vue'))['Switch'];

        ATabPane: (typeof import('ant-design-vue'))['TabPane'];

        ATable: (typeof import('ant-design-vue'))['Table'];

        ATableColumn: (typeof import('ant-design-vue'))['TableColumn'];

        ATableColumnGroup: (typeof import('ant-design-vue'))['TableColumnGroup'];

        ATableSummary: (typeof import('ant-design-vue'))['TableSummary'];

        ATableSummaryCell: (typeof import('ant-design-vue'))['TableSummaryCell'];

        ATableSummaryRow: (typeof import('ant-design-vue'))['TableSummaryRow'];

        ATabs: (typeof import('ant-design-vue'))['Tabs'];

        ATag: (typeof import('ant-design-vue'))['Tag'];

        ATextarea: (typeof import('ant-design-vue'))['Textarea'];

        ATimePicker: (typeof import('ant-design-vue'))['TimePicker'];

        ATimeRangePicker: (typeof import('ant-design-vue'))['TimeRangePicker'];

        ATimeline: (typeof import('ant-design-vue'))['Timeline'];

        ATimelineItem: (typeof import('ant-design-vue'))['TimelineItem'];

        ATooltip: (typeof import('ant-design-vue'))['Tooltip'];

        ATransfer: (typeof import('ant-design-vue'))['Transfer'];

        ATree: (typeof import('ant-design-vue'))['Tree'];

        ATreeNode: (typeof import('ant-design-vue'))['TreeNode'];

        ATreeSelect: (typeof import('ant-design-vue'))['TreeSelect'];

        ATreeSelectNode: (typeof import('ant-design-vue'))['TreeSelectNode'];

        ATypography: (typeof import('ant-design-vue'))['Typography'];

        ATypographyLink: (typeof import('ant-design-vue'))['TypographyLink'];

        ATypographyParagraph: (typeof import('ant-design-vue'))['TypographyParagraph'];

        ATypographyText: (typeof import('ant-design-vue'))['TypographyText'];

        ATypographyTitle: (typeof import('ant-design-vue'))['TypographyTitle'];

        AUpload: (typeof import('ant-design-vue'))['Upload'];

        AUploadDragger: (typeof import('ant-design-vue'))['UploadDragger'];

        AWeekPicker: (typeof import('ant-design-vue'))['WeekPicker'];

        AQrCode: (typeof import('ant-design-vue'))['QRCode'];

        ATour: (typeof import('ant-design-vue'))['Tour'];

        AFloatButton: (typeof import('ant-design-vue'))['FloatButton'];

        AFloatButtonGroup: (typeof import('ant-design-vue'))['FloatButtonGroup'];

        ABackTop: (typeof import('ant-design-vue'))['BackTop'];

        AWatermark: (typeof import('ant-design-vue'))['Watermark'];

        AFlex: (typeof import('ant-design-vue'))['Flex'];
    }
}
export {};
```

:::

#### SSR antd 样式闪烁问题

> [!IMPORTANT] 问题现象
> 页面加载时出现 FOUC (无样式内容闪烁)，核心（**HTML 先于 CSS 加载并渲染**）：
>
> - 初始化时无 CSS 样式 → 闪烁
> - CSS 加载完成后恢复正常

::: danger 常见错误做法

**问题**：CSS 异步加载，打包文件也会增大

```js
export default defineNuxtConfig({
    // ❌ 全量加载 antd CSS，页面会闪烁
    css: ['ant-design-vue/dist/antd.css']
});
```

:::

**推荐方案：按需注入 CSS**

使用官方模块 `@ant-design-vue/nuxt` 的 `extraStyle` 功能在组件加载前完成注入。

**安装**

```sh:no-line-numbers
pnpm add -D @ant-design-vue/nuxt
```

**配置 nuxt.config.ts**

```ts
export default defineNuxtConfig({
    modules: ['@ant-design-vue/nuxt'],
    antd: {
        extraStyle: true // 按需提取和注入 CSS（默认 false） //[!code ++]
    }
});
```

**在组件中使用**

```vue
<template>
    <a-extract-style>
        <!-- Your page or component -->
    </a-extract-style>
</template>
```

---

#### eslint 修复代码 nuxt.config.ts 报错问题

::: tip 问题现象
ESLint 报错 `defineNuxtConfig` 未定义，因为找不到 `TypeScript` 的顶层依赖项（隐藏在 Nuxt 后面）

**解决方案:**

直接安装 TypeScript：

```sh:no-line-numbers
pnpm install -D typescript
```

:::

### JWT

快速说明：后端中间件负责验证 Access Token，失败时使用 Refresh Token 刷新；为避免并发刷新冲突，应使用单例刷新（promise 单例或短期缓存）。

要点：

- 中间件验证：服务端验证 token 并将 user 放入上下文
- 并发刷新：使用单例 promise 或短期缓存，保证只有一次刷新请求
- 路由白名单：对登录接口/页面放行，避免重定向死循环

#### 实现流程

| 环节             | 职责                                  | 关键点                                              |
| ---------------- | ------------------------------------- | --------------------------------------------------- |
| **服务端中间件** | 验证 JWT、刷新 token                  | 进入 `/api/*` 时触发，验证失败用 Refresh Token 刷新 |
| **客户端中间件** | 调用 `/api/user/auth/me` 验证登录状态 | 处理 401 错误、token 过期情况                       |
| **插件拦截**     | 全局拦截 401 响应                     | 弹窗提示并跳转登录页                                |

> [!NOTE]
> **Cookie 存储**：Token 存入 Cookie（`httpOnly` 保护），浏览器自动携带，避免重复登录。注意：`httpOnly` 可防 JS 访问，但开发者工具仍可查看。

#### 核心要点

**🔄 并发刷新问题**

| 问题                   | 解决方案                                     |
| ---------------------- | -------------------------------------------- |
| 多个请求同时刷新 token | 使用单例 Promise，只刷新一次，其他请求等待   |
| 高并发场景             | Promise Pool 或请求去重 + 短期缓存（2-5 秒） |

**⚠️ 路由白名单**

| 必须放行的路由          | 原因                     |
| ----------------------- | ------------------------ |
| `/login` (登录页面)     | 避免未登录时无限重定向   |
| `/api/login` (登录接口) | 允许用户登录并获取 token |

#### 验证流程

<ImgPreview showImgPath="jwt_validate_process.png"/>

**状态判断逻辑**：

1. ✅ AccessToken 未过期 → 直接放行
2. ⏰ AccessToken 过期 + RefreshToken 有效 → 刷新后放行
3. ❌ 无 Token 或 RefreshToken 过期 → 401 错误处理

::: details 01.jwt.server.ts（服务端——自动调试模式）

```ts
// 服务端 JWT 认证中间件——jwt 令牌 token 验证
// 存储用户上下文对象，避免在同一请求反复验证
// 请求结束时 event.context.user 自动销毁
//[!code warning]
//并发请求时，这里需要做防抖，缓存处理。【缓存时间不能太长2~5秒即可】
import { JWTExpired, JWTInvalid } from 'jose/errors';
import { HTTPStatus } from '~~/shared/enums/httpEnums';
import { whiteRoute } from '~~/shared/whiteRoute';
import { decodeJwt } from 'jose';
import { logServer } from '../utils/serverLog';

// 当前更新 access_token 的 promise，保证并发时只会有一个请求刷新
let currentAccessTokenUpdatePromise: Promise<string> | null = null;
// 缓存的 access_token
let targetAccessTokenCache: string | null = null;
// 缓存过期时间戳（秒）
let targetAccessTokenExpires: number = 0;
// 缓存有效期（秒）
const CACHE_EXPIRY_TIME = 5;
const getCurrentTime = () => Math.floor(Date.now() / 1000);

export default defineEventHandler(async (event) => {
    const rawUrl = event.node.req.url || '';
    const path = rawUrl.split('?')[0];
    if (whiteRoute.includes(path)) return;

    const isApiRequest = path.startsWith('/api/');
    const { accessToken, refreshToken } = getTokensFromCookie(event);

    // ===== 调试日志开始 =====
    logServer('=== JWT中间件调试信息 ===');
    logServer('请求路径:', path);
    logServer('当前时间:', new Date().toISOString());
    logServer('当前时间戳(秒):', getCurrentTime());
    logServer('Access Token 存在:', !!accessToken);
    logServer('Refresh Token 存在:', !!refreshToken);

    if (accessToken) {
        try {
            const accessDecoded = decodeJwt(accessToken);
            logServer('Access Token 过期时间:', new Date(accessDecoded.exp! * 1000).toISOString());
            logServer('Access Token 剩余秒数:', accessDecoded.exp! - getCurrentTime());
        } catch (e) {
            logServer('Access Token 解码失败:', e);
        }
    }

    if (refreshToken) {
        try {
            const refreshDecoded = decodeJwt(refreshToken);
            logServer(
                'Refresh Token 过期时间:',
                new Date(refreshDecoded.exp! * 1000).toISOString()
            );
            logServer('Refresh Token 剩余秒数:', refreshDecoded.exp! - getCurrentTime());
        } catch (e) {
            logServer('Refresh Token 解码失败:', e);
        }
    }
    // ===== 调试日志结束 =====

    // 没有任何 token
    if (!accessToken && !refreshToken) {
        logServer('🚫 没有任何token，准备跳转登录');
        if (isApiRequest) {
            throw createError({
                statusCode: HTTPStatus.UNAUTHORIZED,
                statusMessage: 'UNAUTHORIZED',
                message: '未登录或 token 缺失'
            });
        } else {
            return sendRedirect(event, '/');
        }
    }

    // 1. 尝试验证 access_token
    if (accessToken) {
        try {
            logServer('🔍 验证 Access Token...');
            const payload = await verifyAccessToken(accessToken);
            logServer('✅ Access Token 验证成功，用户:', payload.userAccount);
            event.context.user = payload;
            return;
        } catch (err: any) {
            logServer('❌ Access Token 验证失败，尝试使用 Refresh Token:', err.message);
        }
    }

    // 2. 使用 refresh_token 刷新
    if (refreshToken) {
        logServer('🔄 开始 Refresh Token 流程...');

        // 并发等待
        if (currentAccessTokenUpdatePromise) {
            logServer('⏳ 等待其他请求完成刷新...');
            try {
                await currentAccessTokenUpdatePromise;
                if (event.context.user) {
                    logServer('✅ 从其他请求获得用户信息');
                    return;
                }
            } catch (error) {
                logServer('❌ 等待其他请求刷新失败');
            }
        }

        // 缓存有效，直接用
        if (targetAccessTokenCache && targetAccessTokenExpires > getCurrentTime()) {
            logServer('📦 使用缓存的 Access Token');
            event.context.user = decodeJwt(targetAccessTokenCache);
            return;
        }

        // 开始刷新
        logServer('🚀 开始刷新 Access Token...');
        currentAccessTokenUpdatePromise = new Promise(async (resolve, reject) => {
            try {
                logServer('🔍 验证 Refresh Token...');
                const refreshPayload = await verifyRefreshToken(refreshToken);
                logServer('✅ Refresh Token 验证成功，用户:', refreshPayload.userAccount);

                logServer('🔨 生成新的 Access Token...');
                const newAccessToken = await signAccessToken({
                    id: refreshPayload.id,
                    userAccount: refreshPayload.userAccount,
                    userPhone: refreshPayload.userPhone,
                    userAuth: refreshPayload.userAuth
                });

                logServer('🍪 设置新的 Cookie...');
                setTokensFromCookie(event, newAccessToken, refreshToken);
                event.context.user = refreshPayload;

                // 更新缓存
                targetAccessTokenCache = newAccessToken;
                targetAccessTokenExpires = getCurrentTime() + CACHE_EXPIRY_TIME;
                logServer('✅ Access Token 刷新成功!');

                resolve(newAccessToken);
            } catch (e) {
                logServer('❌ Refresh Token 验证失败:', e);
                cleanAllTokensFromCookie(event);

                if (isApiRequest) {
                    if (e instanceof JWTExpired) {
                        logServer('⏰ Refresh Token 已过期');
                        reject(
                            createError({
                                statusCode: HTTPStatus.UNAUTHORIZED,
                                statusMessage: 'UNAUTHORIZED',
                                message: 'token 已过期，请重新登录'
                            })
                        );
                    } else if (e instanceof JWTInvalid) {
                        logServer('🚫 Refresh Token 无效');
                        reject(
                            createError({
                                statusCode: HTTPStatus.UNAUTHORIZED,
                                statusMessage: 'UNAUTHORIZED',
                                message: '无效的 token，请重新登录'
                            })
                        );
                    } else {
                        logServer('❓ 未知认证错误:', e);
                        reject(
                            createError({
                                statusCode: HTTPStatus.UNAUTHORIZED,
                                statusMessage: 'UNAUTHORIZED',
                                message: '认证失败，未知错误，请稍后再试'
                            })
                        );
                    }
                } else {
                    logServer('🏠 非API请求，重定向到登录页');
                    reject(new Error('需要重定向到登录页'));
                }
            } finally {
                logServer('🔄 清理 Promise 状态');
                currentAccessTokenUpdatePromise = null;
            }
        });

        try {
            await currentAccessTokenUpdatePromise;
            if (event.context.user) {
                logServer('✅ 刷新成功，用户已设置');
                return;
            }
        } catch (error) {
            logServer('❌ 刷新失败:', error);
            if (!isApiRequest) {
                return sendRedirect(event, '/');
            }
            throw error;
        }
    }

    // 3. 最终失败
    logServer('🚫 最终认证失败，清理所有 token');
    cleanAllTokensFromCookie(event);
    if (isApiRequest) {
        logServer('❌ API请求认证失败');
        throw createError({
            statusCode: HTTPStatus.UNAUTHORIZED,
            statusMessage: 'UNAUTHORIZED',
            message: '未授权，认证失败'
        });
    } else {
        logServer('🏠 页面请求认证失败，重定向到登录页');
        return sendRedirect(event, '/');
    }
});
```

:::

::: details 01.auth.client.ts（客户端验证服务端有没有成功）

```ts
import { whiteRoute } from '~~/shared/whiteRoute';

//01.auth.client.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
    if (whiteRoute.includes(to.path)) {
        return;
    }

    //获取验证后的user,确保走服务端中间件验证token能正常接受cookie
    try {
        const user = await $fetch('/api/user/auth/me', {
            method: 'GET',
            credentials: 'include' //强制游览器带上cookie,解决在登录情况下不带cookie的问题
        });
        if (user) return;
    } catch (error: any) {
        // 401错误会被全局插件自动处理，显示友好的弹框
        // 这里不需要手动处理，但为了确保路由正确，还是添加检查
        if (error?.status === 401 || error?.statusCode === 401) {
            // 认证错误，插件会处理弹框，这里不做跳转
            // 因为插件会自动跳转到登录页
            return;
        }

        // 其他错误直接跳转
        navigateTo('/', { replace: true });
    }
});
```

:::

fetch-interceptor.ts插件拦截$fetch响应  
**解决token过期401不解决，导致api一直在刷新等待问题，错误没处理，抛出401错误直接弹窗**

::: details fetch-interceptor.ts（插件）

```ts
import { Modal } from 'ant-design-vue';

//处理401错误的插件，主要功能就是弹窗
//自动监听
export default defineNuxtPlugin(() => {
    // 防止重复弹框的标志
    let isDialogShowing = false;

    const showLoginExpiredDialog = () => {
        // 防止重复弹框
        if (isDialogShowing) {
            return;
        }
        isDialogShowing = true;

        Modal.confirm({
            title: '登录已过期',
            content: '您的登录状态已过期，请重新登录',
            okText: '重新登录',
            cancelText: '取消',
            maskClosable: false,
            keyboard: false,
            centered: true,
            //确认取消都直接回到登录页
            onOk() {
                isDialogShowing = false;
                window.location.href = '/';
            },
            onCancel() {
                isDialogShowing = false;
                window.location.href = '/';
            }
        });
    };

    //响应拦截器
    const originalFetch = $fetch.create({
        onResponseError({ response }) {
            if (response.status === 401) {
                showLoginExpiredDialog();
            }
        }
    });

    $fetch = originalFetch;

    // 监听全局未处理的 Promise 拒绝
    if (import.meta.client) {
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason;

            // 检查是否是 401 错误
            if (
                error?.status === 401 ||
                error?.statusCode === 401 ||
                error?.response?.status === 401 ||
                (error?.data && error.data.statusCode === 401)
            ) {
                // 阻止控制台错误显示
                event.preventDefault();
                showLoginExpiredDialog();
            }
        });

        // 监听全局错误事件
        window.addEventListener('error', (event) => {
            const error = event.error;
            if (error?.status === 401 || error?.statusCode === 401) {
                event.preventDefault();
                showLoginExpiredDialog();
            }
        });
    }

    return {
        provide: {
            /**全局方法，处理token过期情况，弹出对话框 */
            handleAuthError: (error: any) => {
                if (
                    error?.status === 401 ||
                    error?.statusCode === 401 ||
                    error?.response?.status === 401
                ) {
                    showLoginExpiredDialog();
                    return true; // 表示已处理
                }
                return false; // 未处理
            }
        }
    };
});
```

:::

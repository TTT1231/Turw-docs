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

`components/` 中的组件会自动导入并生成类型；嵌套路径默认参与组件命名，例如 `components/base/Button.vue` 可使用为 `BaseButton`。也可以自定义扫描目录：

```js
 // 自动导入，识别配置(示例配置) // [!code warning]
 {
    path: '~/components/base',      //路径
    prefix: 'Base',               //前缀
    ignore: ['**/*.stories.ts']  // 忽略特定文件
 },
```

`composables/` 中的组合函数也可自动导入。默认扫描规则对嵌套目录有限制；嵌套文件可以通过顶层索引重新导出，或配置扫描路径。

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

安装 `@pinia/nuxt` 后，`app/stores/` 下的 store 可自动导入；嵌套目录需要配置 `storesDirs`。也可以根据项目习惯手动导入。

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

Nuxt 按目录识别文件用途，并为不同文件提供命名约定：

- 插件可使用 `.client` 或 `.server` 后缀限制运行环境，例如 `plugins/01.auth.client.ts`。
- 路由中间件可使用 `.global` 后缀成为全局中间件，例如 `middleware/auth.global.ts`。
- 插件的数字前缀可用于控制顺序；文件名按字典序排序，因此使用 `01`、`02` 等前缀。

这些后缀不能互换，具体规则取决于目录和文件类型。

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
| `app:rendered`       | 服务端渲染完成后触发                                                |
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

通过声明文件扩展 `NodeJS.ProcessEnv`。确保声明文件被相应的 TypeScript 项目包含；若未被识别，可检查 Nuxt 生成的配置或显式添加类型引用。

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

通过模块增强扩展 `H3EventContext`，并确保声明文件被服务端 TypeScript 配置包含。

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

SEO 帮助搜索引擎理解和发现页面内容；SSR 在服务端生成 HTML，有助于首屏直接呈现内容。SSR 的效果仍取决于服务端响应、资源加载和页面实现，并不保证页面一定更快。

### SEO

页面正文提供实际内容，`head` 中的标题、描述等元数据帮助搜索引擎和分享平台理解页面。两者应保持一致。

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
| `noindex, nofollow` | 请求不收录，也不跟踪链接     | 不希望被收录的公开页面             |

---

##### Open Graph (OG) 协议

Open Graph 元数据供社交平台生成分享卡片，例如标题、描述和图片。

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

Web App Manifest 描述应用的名称、图标和启动方式，可用于添加到主屏幕。按目标设备要求准备不同尺寸的图标。

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

Canonical 链接用于向搜索引擎声明重复或相似页面的首选网址。例如，带跟踪参数的页面可以指向不带该参数的规范网址。是否采纳由搜索引擎决定。

---

##### Robots.txt

`robots.txt` 告诉遵守规则的爬虫哪些路径可以抓取，它不能保护私密内容；后台页面和接口仍需服务端鉴权。

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
   Disallow: ['/back/*', '/api/*'],
   Sitemap: 'https://example.com/sitemap.xml',
},
//生成站点地图
sitemap: {
   enabled: true,
   hostname: 'https://example.com',
   exclude: ['/back/**', '/api/**'],
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

全局 `head` 和结构化数据适合存放各页面共用的信息；页面特有的数据应在页面中配置。

---

#### Body 内容优化

让正文直接回答用户的问题，并使用清晰的标题组织内容；元数据应准确反映正文。

##### ⚠️ 黑帽 SEO 警告

不要向搜索引擎展示刻意隐藏于用户的关键词堆砌内容。这类做法可能违反搜索引擎规则。

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

应直接为用户编写可见、相关的内容。

---

#### 页面级别 SEO

##### 类型安全配置

使用 `useSeoMeta` 获得更好的类型提示和安全性

##### 性能优化策略

优先加载首屏需要的内容和资源，延后非关键脚本，减少其对渲染和交互的影响。可使用 `tagPosition` 调整脚本标签的位置，但位置本身不保证脚本延迟执行，还需根据需要配置 `defer` 或 `async`。

```ts
<script setup lang="ts">
useHead({
  script: [
    {
      src: 'https://my-unimportant-script.com',
      // 有效选项为：'head' | 'bodyClose' | 'bodyOpen'
      tagPosition: 'bodyClose' // 将脚本标签放在 body 末尾
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

服务端渲染结果应与客户端首次渲染一致，否则可能出现水合不匹配。

##### useFetch vs $fetch 选择指南

| 用途                                   | 选择       | 说明                                                                   |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| 页面初始化时获取 SSR 数据              | `useFetch` | 将服务端结果传给客户端水合，避免仅因水合重复请求；也提供状态和刷新能力 |
| 用户交互、表单提交或服务端逻辑中的请求 | `$fetch`   | 直接发起请求；在组件初始化中使用时，SSR 和水合可能各执行一次           |

`useFetch` 也可用于客户端导航和数据刷新，`$fetch` 也可在服务端使用；应按调用时机选择。

## FAQ

以下记录 Nuxt 项目中的常见配置问题和处理方式。

### TS

#### tailwindcss配置问题

Tailwind CSS 的配置方式取决于主版本。Nuxt 不会自动内置 Tailwind；使用 v4 时，可以按 [Tailwind 的 Nuxt 安装指南](https://tailwindcss.com/docs/installation/framework-guides/nuxt) 安装 `tailwindcss` 和 `@tailwindcss/vite`，在 `nuxt.config.ts` 的 Vite 插件中注册，并引入 CSS。

若项目使用 `@nuxtjs/tailwindcss` 模块，应先核对模块支持的 Tailwind 版本，再按对应文档配置；不要混用不同主版本的配置步骤。

#### antd 类型问题

如果组件已经能运行，但编辑器缺少组件属性提示，需要确认类型声明是否被 Nuxt 的 TypeScript 项目包含。可在项目的类型目录中维护 `.d.ts`，并检查生成的配置是否包含该文件；不要在仍需类型提示时删除它。

以下示例展示如何为组件补充全局类型声明：

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

服务端返回 HTML 后，如果组件样式尚未加载，页面可能短暂显示无样式内容（FOUC）。应检查样式是否在首屏渲染前可用，避免仅依赖客户端后续加载。

**推荐方案：按需注入 CSS**

`@ant-design-vue/nuxt` 提供 `extractStyle` 选项，可提取并注入样式。请核对当前模块版本的支持情况，并在 `app.vue` 的最外层使用 `a-extract-style`。

**安装**

```sh:no-line-numbers
pnpm add -D @ant-design-vue/nuxt
```

**配置 nuxt.config.ts**

```ts
export default defineNuxtConfig({
    modules: ['@ant-design-vue/nuxt'],
    antd: {
        extractStyle: true // 按需提取和注入 CSS（默认 false） //[!code ++]
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

若编辑器或 ESLint 无法识别 `defineNuxtConfig`，先检查 Nuxt 生成的类型配置及 ESLint 的全局变量配置；若项目缺少 TypeScript 依赖，可安装：

```sh:no-line-numbers
pnpm add -D typescript
```

### JWT

服务端负责验证访问令牌；过期后可按认证方案验证刷新令牌并签发新令牌。客户端中间件用于改善导航体验，不能替代服务端鉴权。

| 环节         | 职责                                               |
| ------------ | -------------------------------------------------- |
| 服务端中间件 | 保护 API，验证凭证并在当前请求上下文中保存用户信息 |
| 客户端中间件 | 检查登录状态，处理导航和登录提示                   |
| 响应拦截     | 统一处理请求失败，例如跳转登录页                   |

#### 核心要点

- 并发刷新应按用户会话隔离，不能用一个全局 Promise 或令牌缓存共享所有用户的结果。多进程部署还需要考虑跨实例协调和令牌轮换。
- 放行登录页面及登录接口，避免重定向循环；受保护资源仍须在服务端鉴权。
- `HttpOnly` Cookie 可防止 JavaScript 直接读取令牌；同时结合 `Secure`、合适的 `SameSite` 和 CSRF 防护策略。

#### 验证流程

<ImgPreview showImgPath="jwt_validate_process.png"/>

**状态判断逻辑**：

1. ✅ AccessToken 未过期 → 直接放行
2. ⏰ AccessToken 过期 + RefreshToken 有效 → 刷新后放行
3. ❌ 无 Token 或 RefreshToken 过期 → 401 错误处理

::: details 01.jwt.server.ts（服务端示意）

下面示意单次请求中的验证流程。`getTokensFromCookie`、`verifyAccessToken` 等函数需由项目实现；并发刷新、令牌轮换和吊销策略需由认证服务处理。

```ts
import { whiteRoute } from '~~/shared/whiteRoute';

export default defineEventHandler(async (event) => {
    const path = (event.node.req.url || '').split('?')[0];
    if (whiteRoute.includes(path)) return;

    const { accessToken, refreshToken } = getTokensFromCookie(event);

    if (accessToken) {
        try {
            event.context.user = await verifyAccessToken(accessToken);
            return;
        } catch {
            // 访问令牌无效时继续尝试刷新。
        }
    }

    if (refreshToken) {
        try {
            const user = await verifyRefreshToken(refreshToken);
            const newAccessToken = await signAccessToken({
                id: user.id,
                userAccount: user.userAccount,
                userPhone: user.userPhone,
                userAuth: user.userAuth
            });
            setTokensFromCookie(event, newAccessToken, refreshToken);
            event.context.user = user;
            return;
        } catch {
            cleanAllTokensFromCookie(event);
        }
    }

    if (path.startsWith('/api/')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    return sendRedirect(event, '/');
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

下面的插件统一处理 `$fetch` 的 401 响应，提示用户并跳转登录页。实际项目还需避免重复弹窗和登录页跳转循环。

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

---
outline: deep
---

# NUXT SEO SSR

## 核心概念

**SEO（搜索引擎优化）**  
让搜索引擎和爬虫更容易获取页面的内容

**SSR（服务端渲染）**  
提高首屏加载速度，避免 SPA 中首屏白屏问题

## NUXT SEO

<Tip title="提示">
**类比理解：网站 = 实体店**

- **head** = 店面招牌（显示在搜索引擎列表）
- **body** = 店内商品（为用户提供最相关、最优质答案）

两者必须相互关联，**光有 body 没有 head 就像论文只有内容没有标题**
</Tip>

---

### Head 元数据配置

#### 基础元数据

| 标签          | 用途     | 示例                                           |
| ------------- | -------- | ---------------------------------------------- |
| `title`       | 网站标题 | `<title>我的网站</title>`                      |
| `description` | 网站描述 | `<meta name="description" content="...">`      |
| `keywords`    | 关键词   | `<meta name="keywords" content="Vue,Nuxt">`    |
| `author`      | 作者     | `<meta name="author" content="Your Name">`     |
| `robots`      | 爬虫控制 | `<meta name="robots" content="index, follow">` |

#### Robots 指令详解

| 指令                | 含义                         | 适用场景                           |
| ------------------- | ---------------------------- | ---------------------------------- |
| `index, follow`     | 允许收录，并跟踪链接（默认） | 大多数公开页面（如首页、产品页）   |
| `noindex, follow`   | 禁止收录，但跟踪链接         | 临时页面（如测试页、未完成的内容） |
| `index, nofollow`   | 允许收录，但忽略链接         | 免责声明页（链接不传递权重）       |
| `noindex, nofollow` | 禁止收录，且忽略链接         | 隐私页、后台页（完全隐藏）         |

---

#### Open Graph (OG) 协议

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

#### PWA Manifest

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

#### Canonical 链接

<Tip title="提示">
**解决问题：**  Query 参数导致的重复内容困惑

**最佳实践：**

- 有内容时指向自己：`<link rel="canonical" href="当前页面">`
- 无内容时使用 `noindex` 禁止收录

</Tip>

---

#### Robots.txt

<Warning title="注意">
**作用：** 告诉搜索引擎哪些页面可爬取

**注意：** 这只是"建议"，真正的安全依赖**路由守卫**和**服务端鉴权**
</Warning>

**语法：**

```txt
User-agent: *                    # 适用所有爬虫
Disallow: /admin/*               # 禁止爬取 /admin 目录
Disallow: /api/*                 # 禁止爬取 /api 目录
Allow: /public                   # 允许爬取
Sitemap: https://example.com/sitemap.xml  # 站点地图位置
```

---

### 全局 SEO 配置示例（Nuxt SEO 模块）

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
   exc   lude: ['/back/**', '/', '/api/**'],
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

### Body 内容优化

<Tip title="提示">
**关系类比：**

- **head** = 目录/索引
- **body** = 实际内容

搜索引擎会根据用户查询匹配 head 和 body，大多数情况下**以 body 为准**（内容为用户服务，head 只是辅助搜索引擎理解）
</Tip>

#### ⚠️ 黑帽 SEO 警告

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

<Tip title="最佳实践">
去掉隐藏，自然编写内容，真诚为用户创造价值

</Tip>

---

### 页面级别 SEO

#### 类型安全配置

使用 `useSeoMeta` 获得更好的类型提示和安全性

#### 性能优化策略

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

## SSR 服务端渲染

### 基础配置

Nuxt 中启用 SSR 非常简单：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
   ssr: true
});
```

---

### API 调用最佳实践

<Warning title="关键注意事项">
SSR + SEO 场景下，必须保证客户端和服务端内容一致，否则**水合阶段会报错**
</Warning>

#### useFetch vs $fetch 选择指南

| 特性         | useFetch         | $fetch                  |
| ------------ | ---------------- | ----------------------- |
| **执行次数** | 仅一次（有缓存） | 两次（服务端 + 客户端） |
| **SSR 友好** | ✅ 是            | ❌ 否                   |
| **适用场景** | 见下方           | 见下方                  |

#### ✅ useFetch 使用场景

- 🔍 **SEO 内容** - 需要搜索引擎抓取
- 📄 **页面主要内容** - 首屏渲染数据
- 🖥️ **需要服务端渲染的数据** - SSR 必需

#### ✅ $fetch 使用场景

- 🖱️ **用户交互触发** - 点击、滚动等事件
- 📝 **表单提交** - 客户端发起的请求
- 💻 **客户端逻辑** - 仅在浏览器执行
- 🔄 **实时数据更新** - 动态 API 调用

<Tip title="提示">
其他用法两者基本相同，主要区别在于执行时机和缓存策略
</Tip>

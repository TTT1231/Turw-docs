---
outline: deep
---

# NUXT SEO SSR

SEO（搜索引擎优化）让搜索引擎和爬虫更容易获取页面的内容。
SSR（服务端渲染）提高首屏加载速度，避免SPA中首屏白屏问题

## NUXT SEO

head 在搜索时会根据head显示在搜索引擎列表中。【类似店面招牌】
body 网站的内容核心，优化主要优化在这个地方，为用户提供**最相关、最优质答案**，当用户搜索query的文本时，搜索引擎会根据body去匹配用户query【这里面的内容应该与head相关，形成两者相互结合，**光有body没有head类似论文只有内容没有标题，**】

### head

- title 网站的标题
- meta 【name-content】
   - description 网站描述
   - keywords 关键词
   - author 作者
   - robots 控制搜索引擎爬虫对当前页面的抓取和索引行为。
   - og: Open Graph 元数据协议，使得在分享的时候平台能自动抓取网页OG标签，显示对应描述、标题、图片的预览卡片，而不是一个链接，用户友好【property-conetnt】
      - title 分享卡片标题
      - type 分享内容类型，website（网站首页）、article（博客、新闻）、vdeio.move(视频)等
      - image 分享预览图片，必须要有ssl配置https
      - description 对分享内容简要描述
      - site_name 所属网站名称
      - locale 分享页面语言
        ....
   - manifest【link 引入，必须在head中引入，是一个json文件】 将网站添加到主屏幕、和控制视觉表现、还有start_url用户在主屏幕点击图标后应该打开哪个网址，**移动端友好，但是需要提供多种尺寸图标来适应不同设备，还有配置颜色**
   - canonical【link 引入】 解决query搜索，搜索引擎困惑问题，也即一个界面根据query参数渲染不同内容，和分页。**一般如果是一个界面根据query渲染不同内容，直接动态返回，有内容就指向自己，否则就使用noindex禁止搜索引擎收入**

**robots:**
| 指令 | 含义 | 适用场景 |
|---------------------|-----------------------------------|------------------------------------------|
| `index, follow` | 允许收录，并跟踪链接（默认） | 大多数公开页面（如首页、产品页） |
| `noindex, follow` | 禁止收录，但跟踪链接 | 临时页面（如测试页、未完成的内容） |
| `index, nofollow` | 允许收录，但忽略链接 | 免责声明页（链接不传递权重） |
| `noindex, nofollow` | 禁止收录，且忽略链接 | 隐私页、后台页（完全隐藏） |

**manifest options:**

- name 名称
- short_name 简短名称，空间不足无法显示完整名称name，就会显示这个
- start_url 起始url
- display 有四个值，fullscreen全屏显示，standalone像独立原生应用，minimal-ui最小ui导航，browser游览器显示（默认）
- icons 主屏幕上显示图标，必须要提供多种尺寸满足不同设备，格式还必须是png可缩放格式
- description pwa详细描述
- theme_color 主题颜色
- background_color 启动背景颜色
- lang 语言
- orientation 启动应用屏幕方向

<span class="text-red-400">下面这个只是建议爬虫不要访问，具体还是依靠路由守卫和鉴权，或者引入服务端认证</span>

**robots.txt：**
纯文本文件，遵循Robots Exclusion Protocol告诉搜索引擎哪些页面能爬取，哪些不能被爬取，还有网站地图sitemap的位置

- User-agent 爬虫者，一般设置 User-agent:\*（适用所有爬虫，也可也针对特定爬虫者进行设置，例如goolebot谷歌爬虫，User-agent:Goolebot）
- Disallow 禁止爬取，例如Disallow:/back/\*禁止爬虫访问所有/back所有子目录
- Allow 允许爬取
- Sitemap 站点目录，可以使用nuxt中sitemap自动生成，然后引入这个内容

<span class="text-blue-400">这里为了更好进行维护，和省略重复的编写，以nuxt seo模块为例</span>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   全局seo示例
</summary>

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
   host: 'https://www.ip.com', // 必须添加 host 属性
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
               content:
                  '描述内容',
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

</details>

上面全局的**head**和**schema**结构化数据，由于是**全局注入**的，所以这里`存储就是基本上不会变化的数据`

### body

body的内容为用户服务，也是对head的进一步描述，**head相当于目录，而body相当于内容**，搜索引擎会会根据用户的query去匹配head和body，而且大多数情况下会以**body**为准，因为内容是为用户服务的，head只是让搜索引擎更加了解。

<span class="text-red-400">注意：如果只关心搜索引擎排名，为搜索引擎服务就会违背了：“内容为用户而创造，而非搜索引擎”，类似下面做法</span>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   黑帽SEO技术
</summary>

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

</details>

**最佳就是去掉隐藏，很自然的编写内容**

**页面级别的seo**

为了更好的类型提示和安全，直接使用`useSeoMeta`，然后直接配置即可

<span class="text-blue-400">
   为了更好的提高网站的seo排名，针对搜索引擎网络带宽有限，直接针对LCP和TTI进行优化
</span>
也即核心关键脚本和渲染内容首先加载，其他的直接在之后执行即可，使得爬虫优先索引核心内容

常见的方法是使用nuxt中body标签，将不重要的异步请求、脚本执行放入到核心内容全部加载后执行，此时爬虫已经对关键内容爬取完毕，在执行。

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

## SSR

SSRF服务端渲染在nuxt比较简单，直接设置`ssr:true`即可，但是要注意的是在服务端渲染和SEO共同存在的场景下，注意API的调用，也即**useFetch**和 **$fetch**  
由于服务端渲染要保证客户端和服务端在内容上要保持一直，否则水合阶段会报错。因而如果是使用$fetch就要执行两次，而useFetch有缓存只执行一次。
**useFetch 使用场景:**

- SEO内容
- 页面主要内容
- 需要服务端渲染的数据
  **$fetch**
- 用户交互触发
- 表单提交
- 客户端逻辑
- 实时数据更新，调用api

其他用法两者大差不差

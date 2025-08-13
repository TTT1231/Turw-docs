---
outline: deep
---

# 前端安全

## 📜 内容安全策略 (CSP) 最佳实践

通过配置 CSP，可以有效阻止恶意 JavaScript 执行和跨站资源注入。  
部署时应注意：
- **防御恶意用户篡改响应头**（拦截并修改 HTTP Header）
- **强制使用 HTTPS 加密传输**，防止中间人攻击
- **严格限制资源来源**，避免策略过宽

---

### 🛡️ 核心安全指令（必须强制启用）

| 指令 | 作用 | 示例 |
|------|------|------|
| **`default-src 'self' sample.ip`** | 兜底机制，限制所有未单独声明的资源 | `'self' sample.ip` |
| **`script-src 'self' sample.ip`** | 限制 JS 来源，防止外部恶意脚本 | `'self' sample.ip` |
| **`connect-src 'self' sample.ip`** | 限制 XHR/Ajax/WebSocket 请求 | `'self' sample.ip` |
| **`object-src 'none'`** | 禁止 `<object>`、`<embed>`、`<applet>` | `'none'` |
| **`frame-ancestors 'self'`** | 限制页面被谁 iframe 嵌入 | `'self'` |
| **`form-action 'self' sample.ip`** | 限制表单提交目标 | `'self' sample.ip` |
| **`base-uri 'self'`** | 限制 `<base>` 标签的 href | `'self'` |
| **`block-all-mixed-content`** | 禁止 HTTPS 页面加载 HTTP 资源 | _(无参数)_ |
| **`upgrade-insecure-requests`** | 自动升级 HTTP 请求为 HTTPS | _(无参数)_ |

---

### 📝 细化与增强选项（可选）

| 指令 | 作用 | 示例 |
|------|------|------|
| `script-src-elem 'self'` | 单独控制 `<script>` 标签的脚本来源 | `'self'` |
| `style-src 'self' sample.ip 'unsafe-inline'` | 限制 CSS 来源，`unsafe-inline` 允许内联样式（不安全） | `'self' sample.ip 'unsafe-inline'` |
| `img-src 'self' sample.ip` | 限制图片来源 | `'self' sample.ip` |
| `font-src 'self' sample.ip` | 限制字体文件来源 | `'self' sample.ip` |
| `frame-src 'self' sample.ip` | 限制可嵌入 iframe 来源 | `'self' sample.ip` |
| `require-trusted-types-for 'script'` | 配合 Trusted Types API 防止 DOM 注入 | `'script'` |
| `report-to` | 配置 CSP 违规报告发送位置 | `{"group":"g","max_age":10886400,"endpoints":[...]}` |

---

### 📌 安全建议
1. **尽量不要使用 `unsafe-inline`**，改用 **`nonce`** 或 **`hash`** 验证内联脚本。
2. 开启 **`upgrade-insecure-requests`** 与 **`block-all-mixed-content`**，确保统一加密请求。
3. 配置 **`report-to`**，便于及时发现并修复策略违规。

```js
// report-to参数字段，如果要兼容则使用report-uri即可【report-uri sample.ip】
group：指定报告目标的名称，通常对应于 Content-Security-Policy 中的 report-to。
max_age：报告目标的最大有效时间（秒）。
endpoints：定义多个报告端点。一个端点包含一个 URL，报告将发送到这些 URL。
//========================示例============================
Report-To: {"group":"csp-reports-sample","max_age":10,"endpoints":
[{"url":"https://example.com/csp-reports-samples"}]}
//========================结束============================

//JSON报告字段
document-uri：引发违规的页面 URL。
referrer：触发违规请求的页面的引荐来源。
violated-directive：违反的具体指令。
effective-directive：实际触发违规的指令（可能不同于 violated-directive）。
original-policy：请求的完整 CSP 策略。
blocked-uri：被阻止的资源 URL。
source-file：违反策略的资源文件。
line-number：资源出现问题的代码行号。
```

### ⚠️特别注意
在nuxt的开发模式下，必须要设置**script-src * 'unsafe-inline' 'unsafe-eval' http://localhost:\*  ws://localhost:**  允许任意来源的脚本、内联脚本和动态代码执行。HMR和nuxt devtools动态加载和vue编译器等工具需要内联脚本和动态注入代码以实现实时更新。

还有**script-src-elem * 'unsafe-inline' 'unsafe-eval' http://localhost:\*  ws://localhost:** 开发模式下，Nuxt/Vite/Webpack 会动态插入大量 \<script\> 标签或加载外部脚本（如 HMR 客户端、模块热更新脚本），需要明确允许这些行为。

### 实现策略注意（Nuxt为例）
**针对http response注入和网页标签&lt;meta&gt;注入:**  
服务器响应注入csp客户端不能修改，而meta能修改。  
同时如果服务器和meta同时有的话，游览器优先使用服务器csp策略覆盖掉meta策略。  
同时服务器的response注入能够精准的控制，每一个页面的注入csp策略。  
**所以同等情况下，服务器res策略注入csp更好。**    

<span class=" text-red-400 font-bold">Nuxt中：</span> 
**nuxt.config与nuxt server middleware设置CSP对比：**  
在**nuxt.config**会在构建预定义直接生成响应头返回，那么每个请求都是直接返回相应的头部，**虽然是静态**但是其效率、性能更高。&lt;span class=" text-red-400"&gt;缺点是不能自定义每个页面的CSP策略。&lt;/span&gt;  
 
**如果是nuxt server middleware**这种灵活性更高，可以自定义每一个页面甚至是角色划分权限的csp策略，但是如果自定义过多，**每一个请求都会去执行一些条件判断动态引入**，虽然这里可以根据请求的**频数**进行排序，但是会增加一定if性能开销，**如果考虑维护动态设置过多会导致难以维护代码量过多的情况。**  
  
所以实际使用结合实际情况使用最好，**一般只需在server.middleware动态生成nonce和定义csp，然后再渲染html准备返回服务端后，增加nonce即可**这样的代码最少，也最好维护。

### 演示代码（Nuxt为例）
这里服务端中间件只需完成csp指令的设置，和动态生成唯一的**nonce**即可。  
最后在向服务端返回对应html之前，为\<script\>增加nonce即可
```ts
//服务端中间件，完成csp指令的设置和生成nonce
import crypto from "crypto";
export default defineEventHandler((event) => {
  const res = event.node.res;
  const isDev = process.env.NODE_ENV === "development";
  const url = event.node.req.url || "";
  const isApiRoute = url.startsWith("/api/");

  // 为本次请求生成 nonce
  const nonce = crypto.randomBytes(16).toString("base64");
  event.context.cspNonce = nonce;

  const reportUri = "http://localhost:7001/csp-report";

  // API 路由简单策略
  if (isApiRoute) {
    const apiCsp = [
      "default-src 'none'",
      "connect-src 'self' http://localhost:7001",
      `report-uri ${reportUri}`
    ].join("; ");
    res.setHeader("Content-Security-Policy", apiCsp);
    return;
  }

  // 公共指令
  const commonDirectives = [
    "img-src 'self' data: blob:",
    "base-uri 'self'",
    "form-action 'self'",
    `report-uri ${reportUri}`
  ];

  let modeDirectives: string[];

  if (isDev) {
    // 开发模式差异部分
    modeDirectives = [
      "default-src * data: blob:",
      "script-src * 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
      "script-src-elem * 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
      "style-src * 'unsafe-inline'",
      "connect-src * ws://localhost:* http://localhost:* http://127.0.0.1:*",
      "font-src * data:",
      "frame-src *",
      "object-src 'none'",
      "frame-ancestors *"
    ];
  } else {
    // 生产模式差异部分
    modeDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `script-src-elem 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'", 
      "connect-src 'self' http://localhost:7001",
      "font-src 'self' data:",
      "frame-src 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ];
  }

  // 合并模式指令和公共指令
  const csp = [...modeDirectives, ...commonDirectives].join("; ");
  res.setHeader("Content-Security-Policy", csp);
});

```

```ts
//服务端插件，为script添加nonce
//这个render:response会在渲染html完后，准备向客户端返回触发。
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const nonce = event.context.cspNonce as string | undefined;
    if (!nonce) return;
    if (!response.body || typeof response.body !== 'string') return;

    // 只处理 HTML
    const headers = response.headers || {};
    const contentType = (headers['content-type'] || headers['Content-Type'] || '') as string;
    if (!contentType.includes('text/html')) return;

    // 给没有 nonce 的 <script> / <style> 标签自动加上 nonce
    // 注意：避免重复添加（用负向前瞻排除已有 nonce）
    response.body = response.body
       // 匹配 <script 开头的标签，排除已带 nonce 的
      .replace(/<script\b(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`)
       // 匹配 <style 开头的标签，排除已带 nonce 的
      .replace(/<style\b(?![^>]*\bnonce=)/g, `<style nonce="${nonce}"`);
  });
});

```


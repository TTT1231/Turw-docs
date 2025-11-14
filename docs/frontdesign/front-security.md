---
outline: deep
---

# 前端安全

前端安全包括csp内容安全，防止xss攻击和脚本注入，和防止跨站请求伪造  
CSRF和配置生产反向代理隐藏真实服务器ip防范ddos攻击。

## 内容安全策略 (CSP) 最佳实践

通过配置 CSP，可以有效阻止恶意 JavaScript 执行和跨站资源注入。  
部署时应注意：

- **防御恶意用户篡改响应头**（拦截并修改 HTTP Header）
- **强制使用 HTTPS 加密传输**，防止中间人攻击
- **严格限制资源来源**，避免策略过宽

---

### 核心安全指令（必须强制启用）

| 指令                               | 作用                                   | 示例               |
| ---------------------------------- | -------------------------------------- | ------------------ |
| **`default-src 'self' sample.ip`** | 兜底机制，限制所有未单独声明的资源     | `'self' sample.ip` |
| **`script-src 'self' sample.ip`**  | 限制 JS 来源，防止外部恶意脚本         | `'self' sample.ip` |
| **`connect-src 'self' sample.ip`** | 限制 XHR/Ajax/WebSocket 请求           | `'self' sample.ip` |
| **`object-src 'none'`**            | 禁止 `<object>`、`<embed>`、`<applet>` | `'none'`           |
| **`frame-ancestors 'self'`**       | 限制页面被谁 iframe 嵌入               | `'self'`           |
| **`form-action 'self' sample.ip`** | 限制表单提交目标                       | `'self' sample.ip` |
| **`base-uri 'self'`**              | 限制 `<base>` 标签的 href              | `'self'`           |
| **`block-all-mixed-content`**      | 禁止 HTTPS 页面加载 HTTP 资源          | _(无参数)_         |
| **`upgrade-insecure-requests`**    | 自动升级 HTTP 请求为 HTTPS             | _(无参数)_         |

---

### 细化与增强选项（可选）

| 指令                                         | 作用                                                  | 示例                                                 |
| -------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `script-src-elem 'self'`                     | 单独控制 `<script>` 标签的脚本来源                    | `'self'`                                             |
| `style-src 'self' sample.ip 'unsafe-inline'` | 限制 CSS 来源，`unsafe-inline` 允许内联样式（不安全） | `'self' sample.ip 'unsafe-inline'`                   |
| `img-src 'self' sample.ip`                   | 限制图片来源                                          | `'self' sample.ip`                                   |
| `font-src 'self' sample.ip`                  | 限制字体文件来源                                      | `'self' sample.ip`                                   |
| `frame-src 'self' sample.ip`                 | 限制可嵌入 iframe 来源                                | `'self' sample.ip`                                   |
| `require-trusted-types-for 'script'`         | 配合 Trusted Types API 防止 DOM 注入                  | `'script'`                                           |
| `report-to`                                  | 配置 CSP 违规报告发送位置                             | `{"group":"g","max_age":10886400,"endpoints":[...]}` |

---

### 安全建议

1. **尽量不要使用 `unsafe-inline`**，改用 **`nonce`** 或 **`hash`** 验证内联脚本。
2. 开启 **`upgrade-insecure-requests`** 与 **`block-all-mixed-content`**，确保统一加密请求。
3. 配置 **`report-to`**，便于及时发现并修复策略违规。

```js{1,5-8}
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

### Nuxt 开发模式 CSP 配置

> [!WARNING]
> 开发模式下，Nuxt/Vite/Webpack 需要动态脚本支持，必须允许以下行为：

| 指令              | 配置                                                                  | 原因                                              |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `script-src`      | `* 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*` | HMR、DevTools、Vue 编译器需要动态脚本和 WebSocket |
| `script-src-elem` | `* 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*` | 动态 `<script>` 标签注入和模块热更新              |

### CSP 实现策略对比（Nuxt）

#### 注入方式选择

| 方式                 | 优点                                 | 缺点                           | 推荐 |
| -------------------- | ------------------------------------ | ------------------------------ | ---- |
| **HTTP Response 头** | 客户端无法修改，精准控制，优先级最高 | -                              | ✅   |
| **`<meta>` 标签**    | 可动态修改                           | 客户端可修改，优先级低于响应头 | ❌   |

#### 配置方式对比

| 方式                  | 性能      | 灵活性    | 维护成本  | 适用场景          |
| --------------------- | --------- | --------- | --------- | ----------------- |
| **nuxt.config**       | ⭐⭐⭐ 高 | ⭐ 低     | ⭐ 简单   | 全局统一策略      |
| **server middleware** | ⭐⭐ 中   | ⭐⭐⭐ 高 | ⭐⭐ 中等 | 页面级/权限级策略 |

<Tip title="提示">
**推荐方案**：在 server middleware 中动态生成 nonce 和基础 CSP，结合 render hook 为脚本标签注入 nonce，代码最少、最好维护。
</Tip>

### 演示代码（Nuxt为例）

这里服务端中间件只需完成csp指令的设置，和动态生成唯一的**nonce**即可。  
最后在向服务端返回对应html之前，为\<script\>增加nonce即可

::: details 服务端中间件，完成csp指令的设置和生成nonce

```ts
import crypto from 'crypto';
export default defineEventHandler((event) => {
   const res = event.node.res;
   const isDev = process.env.NODE_ENV === 'development';
   const url = event.node.req.url || '';
   const isApiRoute = url.startsWith('/api/');

   // 为本次请求生成 nonce
   const nonce = crypto.randomBytes(16).toString('base64');
   event.context.cspNonce = nonce;

   const reportUri = 'http://localhost:7001/csp-report';

   // API 路由简单策略
   if (isApiRoute) {
      const apiCsp = [
         "default-src 'none'",
         "connect-src 'self' http://localhost:7001",
         `report-uri ${reportUri}`
      ].join('; ');
      res.setHeader('Content-Security-Policy', apiCsp);
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
         'default-src * data: blob:',
         "script-src * 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
         "script-src-elem * 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
         "style-src * 'unsafe-inline'",
         'connect-src * ws://localhost:* http://localhost:* http://127.0.0.1:*',
         'font-src * data:',
         'frame-src *',
         "object-src 'none'",
         'frame-ancestors *'
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
         'upgrade-insecure-requests',
         'block-all-mixed-content'
      ];
   }

   // 合并模式指令和公共指令
   const csp = [...modeDirectives, ...commonDirectives].join('; ');
   res.setHeader('Content-Security-Policy', csp);
});
```

:::

::: details 服务端插件，为script添加nonce

```ts
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

:::

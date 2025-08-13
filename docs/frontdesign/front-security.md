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


# 前端安全

## 内容安全策略(CSP)

用不同指令配置CSP，阻止恶意js执行，**要考虑到恶意用户请求拦截修改header，对传输内容进行加密，降低这一可能性。**<span class=" text-red-400">【指令】:【self &nbsp;sample.ip】</span>
- `default-src:'self' [sample.ip]` 默认资源加载指令,**兜底机制**，其它指令编写时会覆盖它。
- **`script-src:'self' [sample.ip]`** 设置js脚本只能从同源或者sample.ip加载。
- `style-src:'self' [sample.ip] 'unsafe-inline'` 内联样式限制，如果加了`unsafe-inline`就可以使用\<style scoped\>或者style属性,
- `img-src:'self' [sample.ip]` 限制图片加载
- `font-src:'self' [sample.ip]` 限制字体加载
- **`connect-src:'self' [sample.ip]`** 限制**XHR、Ajax、WebSocket** 网络请求或链接
- `frame-src:'self' [sample.ip]` 限制可以嵌入的iframe来源，防止点击劫持
- `object-src:'none'` 限制 \<object\>、\<embed\>、\<applet\> 等插件内容，建议设为 'none'
- `base-uri:'self'` 限制 \<base\> 标签的 href 属性，防止基础URL被篡改
- `form-action:'self' [sample.ip]` 限制表单提交的目标地址，防止表单劫持
- **`report-to:{"group":"[group-sample]","max_age":[number-sample],"endpoints":"[{mulit-obj-url},...]"}`** 当检测到CSP违规时，自动向多个组发送JSON报告  
```js
// report-to参数字段
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
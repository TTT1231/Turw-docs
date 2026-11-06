# HTTP 与 WebSocket 鉴权

此示例分别展示 HTTP 的 Passport JWT 守卫，以及 Socket.IO 连接建立后的 JWT 校验。

## HTTP 鉴权

`JwtGuard` 调用 `jwt.strategy.ts` 验证令牌。`@AuthHttpPublic()` 将路由标记为公开接口，守卫遇到该标记时放行；示例登录接口位于 `src/auth/auth.controller.ts`。

## WebSocket 鉴权

`SocketGateway` 从握手信息中读取令牌，验证令牌和用户状态；验证通过后将用户信息放入 `socket.data.user`。连接期间每分钟重新检查，失败时断开连接；断开时清理定时器。

可从 `src/socket/socket.gateway.ts` 查看连接与消息处理流程，`test-websocket-client.html` 是配套客户端。周期性检查有时间间隔，敏感操作仍需按业务要求检查权限；此示例用于理解流程，接入前应检查异常和连接生命周期处理。

## 自定义全局过滤器

异常过滤器示例位于 `src/exception-filter`，可根据应用需要选择注册方式。

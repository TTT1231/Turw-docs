# Nestjs

## core

### 响应Observable流程

在 HTTP 请求中，NestJS 的拦截器通过 Observable 处理控制器的结果。拦截器可以在请求进入处理器前执行逻辑，也可以在响应流中记录日志或转换结果。

#### 请求生命周期

```text
请求 → 中间件 → 守卫 → 拦截器（进入） → 管道 → 控制器 → 拦截器（返回） → 响应
```

发生未处理的异常时，异常过滤器负责处理异常；它不是每次成功请求都会经过的步骤。不同层级注册的组件有各自的执行顺序。

#### 响应式编程流程

拦截器调用 `next.handle()` 得到表示后续处理结果的 Observable。通过 `pipe()` 可以观察或变换结果；NestJS 负责订阅并处理 HTTP 响应。

#### Observable 在 NestJS 中的作用

Observable 可以表示异步结果或数据流。下面的第一个示例展示订阅，第二个示例在拦截器中观察响应：

::: code-group-fold line-numbers

```ts [of.ts]
import { of } from 'rxjs';

// 订阅时依次发出 1、2，然后完成
of(1, 2).subscribe({
    next: (value) => console.log(value),
    complete: () => console.log('完成')
});
```

```ts [interceptor.ts]
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        console.log('处理请求');
        return next.handle().pipe(
            tap({
                next: () => console.log('收到处理结果'),
                error: (error) => console.error('处理失败', error)
            })
        );
    }
}
```

:::

`tap` 用于观察流而不替换发出的值；如果需要转换响应，可使用 `map` 等操作符。

### DI思想

[详情见服务端架构设计思想](../backend/architect-design-thought.md#ioc、di)

### 装饰器

装饰器是附着在类、方法或属性上的函数。NestJS 使用装饰器标记控制器、提供者、路由和其他元数据，再由框架读取这些信息。

常见 NestJS 项目使用 TypeScript 的传统装饰器配置：`experimentalDecorators` 开启传统装饰器，`emitDecoratorMetadata` 为依赖类型推断生成设计时元数据。接口、泛型等类型在运行时不存在；需要时应使用显式注入 token。

TypeScript 5 引入的新标准装饰器与传统装饰器的调用方式和元数据支持不同，不能直接等同。需要使用 NestJS 时应以项目和框架版本的配置为准。[查看新标准装饰器示例](./basical.md#stage3)。

## meta handle

NestJS 中这两个工具解决不同问题：

| 工具              | 用途                   | 常见场景                   |
| ----------------- | ---------------------- | -------------------------- |
| `Reflector`       | 读取装饰器设置的元数据 | 守卫或拦截器读取权限等配置 |
| `MetadataScanner` | 扫描原型上的方法名称   | 发现和处理类中的方法       |

`MetadataScanner.getAllMethodNames()` 返回原型链上的方法名；方法名本身不是元数据，仍需另行读取方法上附着的信息。

## 缓存监控

<CodeViewer
public-path="/Turw-docs/codeview-container/nest-cache-monitor"
default-file="main.ts"/>

## 动态模块

### 模块配置

动态模块通过静态方法接收配置并返回模块定义，让同一个模块可在不同场景使用。以下是 NestJS 社区常用的命名约定，具体行为仍以模块实现为准：

| 方法                                 | 常见用途                                       |
| ------------------------------------ | ---------------------------------------------- |
| `forRoot()`                          | 为应用配置一次，供多个地方复用                 |
| `forFeature()`                       | 基于根配置，为当前模块注册特定功能             |
| `register()`                         | 为调用它的模块提供一组配置；不同模块可分别配置 |
| `forRootAsync()` / `registerAsync()` | 通过依赖注入和工厂等方式获取配置               |

这些名称不是框架强制规则。是否需要实例标识、提供者如何注册，取决于具体模块的设计。`global: true` 会使模块导出的提供者在其他模块中可用，不代表每个动态模块实例都适合设为全局；使用多个配置时，应检查 token 和可见性，避免注入到非预期的实例。

参考 [NestJS 动态模块](https://docs.nestjs.com/fundamentals/dynamic-modules)。

### 使用

<CodeViewer
public-path="/Turw-docs/codeview-container/nest-dynamic-module"
default-file="main.ts"/>

## passport和webSocket

<CodeViewer
public-path="/Turw-docs/codeview-container/nestjs-password-websocket"
default-file="main.ts"
height="600px"
/>

## ws适配器使用

::: code-group-fold line-numbers

```ts [main.ts]
import { WsAdapter } from '@nestjs/platform-ws';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useWebSocketAdapter(new WsAdapter(app)); //[!code ++]
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
```

```ts [usage-gateway.ts]
import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway(3001, {
    path: '/ws',
    cors: {
        origin: '*'
    }
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    //网关注入风格,webSocket-server实例
    @WebSocketServer() server: Server; // Injects the WebSocket server instance

    afterInit(server: Server) {
        console.log('WebSocket Gateway initialized');
    }
    handleConnection(client: WebSocket, args: any[]) {
        console.log('连接参数 args 详情：');
        console.dir(args, { depth: null }); // depth: null 表示打印所有层级
        console.log('========================================================================');
        return {
            event: 'connected',
            data: 'Successfully connected to WebSocket!'
        };
    }
    handleDisconnect(client: WebSocket) {
        console.log(`Client disconnected: ${client}`);
    }

    @SubscribeMessage('message') // Listens for messages with the 'message' event
    handleMessage(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        console.log(`Received message from client: ${data}`);
        return {
            event: 'message',
            data: `Server received: ${data}`
        };
    }

    @SubscribeMessage('nihao')
    handleMessageNihao(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        console.log(`Received nihao message from: ${data}`);

        return {
            event: 'nihao',
            data: `Server received: ${data}`
        };
    }

    @SubscribeMessage('testin')
    handleMessageTestIn(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        console.log(this.server.clients);
        return { event: 'testin', data: `BACKEND:Server received: ${data}` };
    }

    //广播
    @SubscribeMessage('broadcast') // Listens for messages with the 'broadcast' event
    handleBroadcast(@MessageBody() data: string, @ConnectedSocket() client: WebSocket) {
        console.log(`Received broadcast message from client ${client}: ${data}`);
        // Broadcast the message to all connected clients
        this.server.clients.forEach((c) => {
            if (c !== client && c.readyState === WebSocket.OPEN) {
                c.send(
                    JSON.stringify({
                        event: 'broadcast',
                        data: `Broadcast from ${client}: ${data}`
                    })
                );
            }
        });
        return {
            event: 'broadcast',
            data: `Server broadcasted: ${data}`
        };
    }
}
```

```ts [usage-frontend.ts]
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => {
    console.log('WebSocket 连接已建立');
    const message = {
        event: 'testin', // 这里的 'message' 与后端 @SubscribeMessage('message') 对应
        data: '前端发送的内容' // 传递给后端的数据（会被 @MessageBody() 接收）
    };
    // 发送 JSON 字符串格式的消息
    ws.send(JSON.stringify(message));
};

// 接收后端消息
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('收到后端消息：', message);
    if (message.event === 'message') {
        console.log('这是来自后端 message 事件的响应：', message.data);
    }
};
```

:::

## 实用工具函数

### extractConfigFromKeys

提取指定配置键；返回值是 `Partial<T>`，调用方需要处理缺失的配置。

```ts
//简化返回配置
import { ConfigService } from '@nestjs/config';

/**
 * 从 ConfigService 提取指定 keys 的配置；缺失的键不会出现在结果中
 * @param configService NestJS ConfigService
 * @param keys 必须指定要提取的键（数组）
 *
 * usages like
 * interface YourConfig{
 * //some keys
 * nihao: string;
 * }
 * extractConfigFromKeys<YourConfig>(ConfigService, ['nihao']);
 * //这样避免了繁琐的手动get和类型断言
 */
export function extractConfigFromKeys<T>(
    configService: ConfigService<T, true>,
    keys: Array<keyof T>
): Partial<T> {
    const result: Partial<T> = {};

    keys.forEach((key) => {
        // 使用类型断言确保 key 是合法的 Path<T>
        const value = configService.get(key as string & keyof T, { infer: true });
        if (value !== undefined) {
            result[key] = value as T[keyof T];
        }
    });

    return result;
}
```

### cookies

按使用的 HTTP 平台选择示例，并先注册对应的 Cookie 解析中间件或插件。转换失败时示例会返回传入的默认值。

::: code-group-fold line-numbers

```ts [V.express.ts]
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type CookieOptions<T = string> = {
    /** Cookie 键名 */
    key?: string;
    /** 默认值 */
    defaultValue?: T;
    /** 类型转换函数 */
    transform?: (value: string) => T;
};

/**
 * @description 自定义装饰器，从 HTTP Request 提取 cookies（类型安全增强版）
 * @usageNotes 基于 express 和 cookie-parser 中间件
 * @template T - Cookie 值的类型
 * @param options - Cookie 选项或键名字符串
 *
 * @example
 * // 获取单个 cookie（字符串）
 * getCookie(@Cookies('sessionId') sessionId: string | undefined)
 *
 * // 获取单个 cookie 并指定默认值
 * getCookie(@Cookies({ key: 'sessionId', defaultValue: 'anonymous' }) sessionId: string)
 *
 * // 获取并转换类型
 * getCount(@Cookies({
 *   key: 'count',
 *   transform: (v) => parseInt(v, 10),
 *   defaultValue: 0
 * }) count: number)
 *
 * // 获取所有 cookies
 * getAllCookies(@Cookies() cookies: Record<string, string>)
 */
export const Cookies = createParamDecorator(
    <T = string>(
        options: string | CookieOptions<T> | undefined,
        ctx: ExecutionContext
    ): T | Record<string, string> | undefined => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const cookies: Record<string, string> | undefined = request.cookies;

        // 如果没有传入任何参数，返回所有 cookies
        if (options === undefined) {
            return cookies ?? {};
        }

        // 字符串参数
        if (typeof options === 'string') {
            return cookies?.[options] as T | undefined;
        }

        // 处理对象配置
        const { key, defaultValue, transform } = options;

        // 没有指定 key，返回所有 cookies
        if (!key) {
            return cookies ?? {};
        }

        const value = cookies?.[key];

        // Cookie 不存在时返回默认值
        if (value === undefined) {
            return defaultValue as T;
        }

        // 如果提供了转换函数，进行类型转换
        if (transform) {
            try {
                return transform(value);
            } catch (error) {
                // 转换失败时返回默认值
                return defaultValue as T;
            }
        }

        return value as T;
    }
);
```

```ts [V.fastify.ts]
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

type CookieOptions<T = string> = {
    /** Cookie 键名 */
    key?: string;
    /** 默认值 */
    defaultValue?: T;
    /** 类型转换函数 */
    transform?: (value: string) => T;
};

/**
 * @description 自定义装饰器，从 Fastify Request 提取 cookies（类型安全增强版）
 * @usageNotes 基于 fastify 和 @fastify/cookie 插件
 * @template T - Cookie 值的类型
 * @param options - Cookie 选项或键名字符串
 *
 * @example
 * // 获取单个 cookie（字符串）
 * getCookie(@Cookies('sessionId') sessionId: string | undefined)
 *
 * // 获取单个 cookie 并指定默认值
 * getCookie(@Cookies({ key: 'sessionId', defaultValue: 'anonymous' }) sessionId: string)
 *
 * // 获取并转换类型
 * getCount(@Cookies({
 *   key: 'count',
 *   transform: (v) => parseInt(v, 10),
 *   defaultValue: 0
 * }) count: number)
 *
 * // 获取所有 cookies
 * getAllCookies(@Cookies() cookies: Record<string, string>)
 */
export const Cookies = createParamDecorator(
    <T = string>(
        options: string | CookieOptions<T> | undefined,
        ctx: ExecutionContext
    ): T | Record<string, string> | undefined => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        const cookies: Record<string, string> = request.cookies ?? {};

        // 如果没有传入任何参数，返回所有 cookies
        if (options === undefined) {
            return cookies;
        }

        // 字符串参数
        if (typeof options === 'string') {
            return cookies[options] as T | undefined;
        }

        // 处理对象配置
        const { key, defaultValue, transform } = options;

        // 没有指定 key，返回所有 cookies
        if (!key) {
            return cookies;
        }

        const value = cookies[key];

        // Cookie 不存在时返回默认值
        if (value === undefined) {
            return defaultValue as T;
        }

        // 如果提供了转换函数，进行类型转换
        if (transform) {
            try {
                return transform(value);
            } catch (error) {
                // 转换失败时返回默认值
                return defaultValue as T;
            }
        }

        return value as T;
    }
);
```

```ts [V.common.ts]
//[!code warning]
//特别要注意类型安全
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type CookieOptions<T = string> = {
    /** Cookie 键名 */
    key?: string;
    /** 默认值 */
    defaultValue?: T;
    /** 类型转换函数 */
    transform?: (value: string) => T;
};

/**
 * @description 跨平台通用的 Cookie 参数装饰器（类型安全增强版）
 * @template T - Cookie 值的类型
 * @param options - Cookie 选项或键名字符串
 *
 * @example
 * // 获取单个 cookie（字符串）
 * getCookie(@Cookies('sessionId') sessionId: string | undefined)
 *
 * // 获取单个 cookie 并指定默认值
 * getCookie(@Cookies({ key: 'sessionId', defaultValue: 'anonymous' }) sessionId: string)
 *
 * // 获取并转换类型
 * getCount(@Cookies({
 *   key: 'count',
 *   transform: (v) => parseInt(v, 10),
 *   defaultValue: 0
 * }) count: number)
 *
 * // 获取所有 cookies
 * getAllCookies(@Cookies() cookies: Record<string, string>)
 */
export const Cookies = createParamDecorator(
    <T = string>(
        options: string | CookieOptions<T> | undefined,
        ctx: ExecutionContext
    ): T | Record<string, string> | undefined => {
        const request = ctx.switchToHttp().getRequest();
        const cookies: Record<string, string> | undefined = request.cookies;

        // 如果没有传入任何参数，返回所有 cookies
        if (options === undefined) {
            return cookies ?? {};
        }

        // 兼容旧版字符串参数
        if (typeof options === 'string') {
            return cookies?.[options] as T | undefined;
        }

        // 处理对象配置
        const { key, defaultValue, transform } = options;

        // 没有指定 key，返回所有 cookies
        if (!key) {
            return cookies ?? {};
        }

        const value = cookies?.[key];

        // Cookie 不存在时返回默认值
        if (value === undefined) {
            return defaultValue as T;
        }

        // 如果提供了转换函数，进行类型转换
        if (transform) {
            try {
                return transform(value);
            } catch (error) {
                // 转换失败时返回默认值
                return defaultValue as T;
            }
        }

        return value as T;
    }
);
```

:::

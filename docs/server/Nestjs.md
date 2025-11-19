---
outline: deep
---

# Nestjs

## 源码逻辑

### 响应Observable流程

整个响应流程指：**真正开始处理请求到返回响应数据结束**的完整过程。

#### 请求生命周期

```
请求进入 → 中间件 → 守卫 → 拦截器(Before) → 管道 → 控制器 → 拦截器(After) → 异常过滤器 → 响应发出
```

#### 响应式编程流程

- **核心阶段**：拦截器(Before) → 管道 → 控制器 → 拦截器(After)
- **其他阶段**：属于HTTP生命周期范畴

#### Observable 在 NestJS 中的作用

**NestJS** 使用 **Observable** 统一处理所有抽象模型和流程：

- 统一输出格式（number、Promise、Observer等）
- 特别适用于：微服务、WebSocket、流操作等
- 内部借助 **RxJS** 解决异步操作的便利性和强大功能

看下面的代码，Nestjs响应式设计与下面类似。

::: code-group

```ts [of.ts]
//RxJX of
//from方法跟of类似，不过from可以从数组、迭代对象、Promise或者类Observable的数据源创建一个Observable
function of(value: any): Observable {
   return new Observable((subscriber) => {
      //Observable的执行体,一旦被订阅这里会立即执行
      subscriber.next(value); //向订阅者发送value

      //input stream complete
      subscriber.complete();
   });
}

//核心：当被订阅的时候会自动执行
const observables = of[(1, 2)];
observables.subscribe({
   next: (val) => console.log(val) //print 1,2
});
```

```ts [handle.ts]
//抽象类型
export interface CallHandler<T = any> {
   /**
     * Returns an `Observable` representing the response stream from the route
     * handler.
   */
   handle(): Observable<T>;
}

handle()返回 new Observable(subscrier =>{}),在nestjs框架在触发订阅的时候会被触发（这个在最外部订阅的Observable触发，以HTTP的请求周期为例就是在最后一个after拦截器之后，nest会启动该订阅）
//这个订阅，订阅的是最外部的Observable
//这个Observable是nestjs针对拦截器、管道、控制器处理好的一条Observable链
//也就是最后一个拦截器中返回的哪个Observable
//类似单链表，随着一个一个的节点的加入，当最后一个节点加入时，组成了一条完整的单链表



/**
 * 调用 next.handle() 会将当前的 HTTP 请求传递给下一个拦截器或最终的 HTTP 处理逻辑（如控制器）。
 * next.handle() 返回的是一个 RxJS Observable，代表整个请求-响应流程的异步操作流。
 *
 * NestJS 内部会订阅这个 Observable，并在数据流（比如响应数据）发出时，
 * 自动将响应内容写入底层的 HTTP 平台响应对象（如 Express 或 Fastify 的 Response）。
 * 也就是说，**不需要手动将 Observable 的结果转换为 HTTP 响应**，NestJS 会帮你完成。
 *
 * 这里我们通过 .pipe(tap(...)) 对这个 Observable 进行“监听”，
 * 但并不会改变流的正常执行流程。tap 是一个纯副作用操作符，
 * 它允许我们在不干预数据流的情况下，观察流中的事件：
 * - next: 每当有新的数据项（如响应数据）发出时触发（但通常在 HTTP 场景中可能不常见，除非手动发出多个值）。
 * - complete: 当整个流成功结束（即请求处理完毕，响应已发送）时触发。
 *
 * 所以这里的 tap 主要用于在请求/响应流程中的某些关键节点打印日志，
 * 不会影响最终响应返回给客户端的过程。
 */
return next.handle().pipe(
   tap({
      //在该拦截器结束时，会打印After intercept
      next: () => {
         console.log('After intercept');
      },
      //在该拦截器流结束时会打印
      complete: () => {
         console.log('拦截流结束');
      },
   }),
);
```

:::

::: tip 提示
在Nestjs中Controller方法中，最后的结果也会被Observable包裹，统一返回格式，统一拦截器的Obserable和管道的链式调用触发
:::

### DI思想

[详情见服务端架构设计思想](./architect-design-thought.md#职责、模块分离思想)

### 装饰器

装饰器的本质是一个函数，用来修饰类、方法、属性。

- 类装饰器，可以给类添加`元数据`也可以返回一个`新构造函数`
- 方法装饰器,接受类的原型、方法名、方法描述符作为参数，`修改方法实现`
- 属性装饰器,接受类的原型和属性名作为参数，可以对属性进行元数据`标记`

::: warning 注意
截至`2025/10/12` Nestjs还是使用stage2写法，因此它会自动添加元数据`design:paramtypes`但这种不安全，它试图将静态拓展到动态违背了TS设计原则，因此在stage3中被移除了。

同时由于是stage2写法所有在tsconfig.json中必须要配置`emitDecoratorMetadata`和`experimentalDecorators`**值为true**，否则其内部提供的元数据会失效，DI和AOP会失效，工厂函数创建实例失败。
:::

::: tip 提示
TS5+版本默认是开启stage3的，因此如果想要使用stage3就需要关闭stage2的tsconfig，也就是`experimentalDecorators`和`emitDecoratorMetadata`

截止**2025/11**月，nestjs目前还是使用**stage2**
:::

**details stage3示例用法:**

::: code-group

<!-- prettier-ignore-start -->
```ts [class-decorator.ts]
/**
 * @description 类装饰器 - 新标准 (Stage 3 Decorators)
 * @returns 返回一个类装饰器函数
 * @template T - 传递给装饰器的泛型参数，解决this类型问题
 * @returns @param target - 被装饰的类构造函数
 * @returns @param context - 类装饰器上下文，包含类的元数据和初始化器
 */
export function classDecorator(token?: string) {
   return function <T extends abstract new (...args: any[]) => any>(
      target: T,
      context: ClassDecoratorContext<T>
   ): T | void {
      /**
       * !获取不了参数名称，这里是编译时，运行时会被删除所以获取不到
       * @description 获取构造函数参数类型数组
       * @deprecated 这里ts编译器在新的版本中，由于违反了职责单一原则，不再自动添加设计时元数据
       */
      // Reflect.getMetadata('design:paramtypes', target) || [];

      /**
       * TODO: 设置类修饰器自定义元数据
       * !特别注意，context.addInitializer在类装饰器和方法装饰器还有属性装饰器中的行为不同，体现在
       *    - 类装饰器中，addInitializer的回调在类定义完成时执行，this指向类的构造函数（类本身）
       *    - 方法装饰器中，addInitializer的回调在类实例化时执行，this指向类的实例对象
       *    - 属性装饰器中，同方法装饰器类似，其必须要初始化类实例才能执行
       * @example @usage
       * ```ts
       * @classDecorator()
       * class A {}
       * const class_value = Reflect.getMetadata('custom:class', A);
       * //打印：类元数据，不用实例化类
       * console.log('类元数据：', class_value);
       * ```ts
       */
      context.addInitializer(function (this: T) {
         Reflect.defineMetadata('custom:class', '类元数据，不用实例化类', target);
      });

      //不对类进行修改，返回undefined
      return undefined;
   };
}
```
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
```ts [method-decorator.ts]
/**
 * @description 方法装饰器 - 新标准 (Stage 3 Decorators)
 * @returns 返回一个方法装饰器函数
 * @template T - 传递给装饰器的泛型参数，解决this类型问题
 * @template This - 方法的this类型
 * @template Args - 方法参数类型元组
 * @template Return - 方法返回值类型
 * @returns @param target - 被装饰的方法，指向原方法
 * @returns @param context - 方法装饰器上下文，包含方法的元数据
 */
export function methodDecorator<T>() {
   return function <This extends Object, Args extends any[], Return>(
      target: (this: This, ...args: Args) => Return,
      context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
   ) {
      /**
       * @description 类定义时执行，直接在target（原方法）上设置元数据，将元数据附加到原方法中,
       *              可以通过 A.prototype.[methodName] 访问，然后获取元数据
       * @usage       用于不用实例化类就能获取元数据
       * !注意: 如果是在context.addInitializer中定义元数据，则在类实例化时执行,
       *              !该方法中的回调是在类实例化阶段执行的，不是在定义阶段
       * @usage       然后如果想要在实例化时获取元数据可以将元数据绑定到类实例上，必须在context.addInitializer中定义
       *
       * @example
       * ```ts
       * class A {
       *   @methodDecorator()
       *   say() {console.log('say'); }
       * }
       * const method_value = Reflect.getMetadata('custom:method:noInit', A.prototype.say, 'say');
       * //打印：类不用初始化就能获取元数据
       * console.log('方法元数据：', method_value);
       * ```ts
       */
      Reflect.defineMetadata(
         'custom:method:noInit',
         '类不用初始化就能获取元数据',
         target,
         context.name
      );

      /**
       * @description 在运行阶段获取元数据，编译时必须要写在context.addInitializer回调中
       * @note 注意this 指向问题
       * @example @usage
       * ```ts
       * class A {
       *   @methodDecorator()
       *   say() {console.log('say'); }
       * }
       * const a = new A();
       * const method_value = Reflect.getMetadata('custom:method:mustInit', a, 'say');
       * //打印：类必须要初始化才能获取元数据
       * console.log('方法元数据：', method_value);
       * ```ts
       */
      context.addInitializer(function (this: This) {
         Reflect.defineMetadata(
            'custom:method:mustInit',
            '类必须要初始化才能获取元数据',
            this.constructor.prototype,
            context.name
         );
      });

      // 在新标准中,方法装饰器返回新的方法实现或 undefined，同类装饰器返回类似
      //TODO 不修改方法实现，返回undefined
      return undefined;

      //TODO 修改方法实现
      // return function (this: This, ...args: Args): Return {
      //     console.log(`Calling method: ${String(context.name)}`);
      //     return target.apply(this, args);
      // };
   };
}
```
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
```ts [property-decorator.ts]
/**
 * @description 属性装饰器 - 新标准 (Stage 3 Decorators)
 * @template T - 指向类类型
 * @template Value - 属性值类型，也就是属性的类型
 * @returns @param target - 被装饰的属性，新标准值为undefined
 * @returns @param context - 属性装饰器上下文，包含属性的元数据
 * @returns @returns @param this - 指向类实例
 */
export function propertyDecorator<T extends Object, Value>() {

    //!第一个参数由于target是undefined，所以无法直接定义元数据，可以直接省略
    return function (
        context: ClassFieldDecoratorContext<T, Value>
    ): (initialValue: Value) => Value {

        /**
         * !十分注意的是： 这里的this指向类实例，但是在addInitializer回调中，this指向类的构造函数。也就是说这里的addInitializer每次实例化时执行
         * TODO 在类实例化时定义元数据
         * @example @usage
         * ```ts
         * class A {
         *   @propertyDecorator()
         *   name: string = '你好啊';
         * }
         * const a = new A();
         * const property_value = Reflect.getMetadata('custom:property', a, 'name');
         * //打印：类必须要初始化才能获取元数据
         * console.log('属性元数据：', property_value);
         * ```ts
         */

        context.addInitializer(function (this: T) {
            Reflect.defineMetadata(
                "custom:property",
                "property_value",
                this,
                context.name
            );
        });

        //TODO 修改属性的初始值 ,这里不修改直接原样返回
        //!注意类型
        return function (this: T, initialValue: Value): Value {
            return initialValue;
        };
    };
}

```
<!-- prettier-ignore-end -->

:::

## 元数据处理实践

针对**Nestjs**提供的两种元数据处理`Reflector`和`MetadataScanner`两者侧重点不同，虽然都是简化元数据处理，两者在使用场景和侧重点不同。

**Reflector:**

- 简化元数据获取，通常从类、方法、参数获取装饰器简化**设置**和**获取**
- 主要在守卫、拦截器、管道中来获取元数据
- 自定义装饰器和元数据获取

**MetadataScanner:**

- 关注：**方法元数据**获取，倾向结构化和静态的扫描
- 主要用在静态扫描和自动化注册以及模块化和配置

::: tip 提示
MetadataScanner现在只保留了**getAllMethodNames**，用来获取类原型上面的所有方法名称，用于发现控制器方法和AOP增强方法
:::

## 缓存监控与埋点

> 详情代码：[stackblitz](https://stackblitz.com/edit/ttt1231-nestjs-cachemonoitor?file=README.md)

> 详情Github仓库：[Github](https://github.com/TTT1231/nestjs-cachemonitor)

## 动态模块配置验证与实现

### 模块配置实践

**nestjs官方设计实践:**

| 方法前缀 |    语义     |     设计意图     |
| :------: | :---------: | :--------------: |
|   for    | 为...而配置 | 强调目的和作用域 |
| register |    注册     | 强调行为和灵活性 |
|  Async   |    异步     |  强调时机和依赖  |

> [!IMPORTANT] 模块配置方法
>
> - forRoot:为根模块进行配置,通常只在AppModule中调用一次,配合@Global将其provider配置到全局完成全局provider的提供，也可以使用动态模块的global属性
> - register:为需要功能的模块中调用,需要提供moduleId用来标识不同实例,交由nestjs容器来管理.
> - asyncRegister:异步配置,可以使用其他提供者的provider进行配置.
>
> 注意这个asyncRegister，如果声明了global那么其内部提供的moduleId中token会被覆盖,也即是这个moduleId的token被全局注册了,显然违背了模块设计思想,因为根本用不着,全局模块提供的服务应该是唯一的单例的可复用的

### 实际使用

> 详情代码：[stackblitz](https://stackblitz.com/edit/nestjs-dynamicmodule-rte9xnqd)

> 详情Github仓库：[Github](https://github.com/TTT1231/nestjs-dynamicmodule-rte9xnqd)

## passport策略与webSocket

> 详情代码：[stackblitz](https://stackblitz.com/edit/nestjs-passport-websocket-zwhyb6vz?file=README.md)

> 详情Github仓库：[Github](https://github.com/TTT1231/nestjs-passport-websocket-zwhyb6vz)

## redis多节点部署

> 详情Github仓库：[Github](https://github.com/TTT1231/redis-single-deploy)

## ws适配器使用

::: code-group

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

```ts
//简化返回配置
import { ConfigService } from '@nestjs/config';

/**
 * 从 ConfigService 提取指定 keys 的配置，生成符合接口 T 的对象
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
): T {
   const result: Partial<T> = {};

   keys.forEach((key) => {
      // 使用类型断言确保 key 是合法的 Path<T>
      const value = configService.get(key as string & keyof T, { infer: true });
      if (value !== undefined) {
         result[key] = value as T[keyof T];
      }
   });

   return result as T;
}
```

### cookies

::: code-group

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
      const cookieList = request.cookies?.getAll() ?? [];
      const cookies: Record<string, string> = cookieList.reduce(
         (obj, cookie) => {
            obj[cookie.name] = cookie.value;
            return obj;
         },
         {} as Record<string, string>
      );

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

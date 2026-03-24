# GraphQL

graphQL统一用`POST`请求，即使是`GET`，主要是如果是用`GET`请求，query查询很容易超过浏览器URL长度（2048）。

同时由于统一采用了`POST`请求，因此`GET`请求缓存没用了，因此需要在客户端中进行缓存，如果需要缓存的前提下。

## 流程

```
请求 -> 解析 -> 验证 -> 执行(Execute)

- 解析：解析为AST抽象语法树，检查语法是否正确。
- 验证：检查AST与schema字段是否存在和匹配等，如果存在AST中有schema中没有字段就报错。
- 执行：GraphQL 引擎按照**字段解析链 (Resolver Chain)** 逐层执行。也即逐个字段执行

```

## 服务端

### fastify

以该框架使用`mercurius`为例，

```sh
pnpm add mercurius
```

#### 缓存问题

> [!TIP]
> `mercurius` 的缓存机制以 `fieldName + args` 作为缓存键。即相同字段名 + 相同参数会命中缓存，因此如果参数不同（如 `user(id: 1)` 和 `user(id: 2)`）则不会命中。
>
> 如果是客户端的话则是`query + args`。
>
> 服务端加上缓存主要是为了缓解数据库压力，而客户端加缓存主要是减少网络带宽和资源消耗避免没有必要的重新请求。

::: code-group

```ts [server.ts]
query {
   user(id: "hello"){
      name
   }
}
//cacheKey: "user:{\"id\":\"hello\"}"
```

```ts [client.ts]
query {
   user(name: "hello"){
      name
   }
}
//cacheKey: "query{user(name:\"hello\"){name}}"
```

:::

> [!IMPORTANT] 重要
> 上述中服务端缓存key不包含查询字段`name`是有意为之的，主要目的就是为了减少碎片，如果每个字段都组合的话会造成利用率极低（主要体现为同一个数据有N份）例如：
>
> ```
>   cache["users:id,name"]           = [{ id: 1, name: "hello" }]
>   cache["users:id,email"]          = [{ id: 1, email: "qwe@test.com" }]
>   cache["users:id,name,email"]     = [{ id: 1, name: "hello", email: "qwe@test.com" }]
> ```
>
> **客户端** 不知道这个响应是否满足另一个查询的字段需求，因此需要包含完整query进行判断。

#### 开启缓存

**注意：** `mercurius`开启缓存需要插件，直接使用官方提供的`mercurius-cache`即可。

```sh
pnpm i mercurius-cache
```

| 选项   | 类型              | 默认值 | 说明                                   |
| ------ | ----------------- | ------ | -------------------------------------- |
| ttl    | number / function | 0      | 缓存存活时间（秒），0 表示禁用         |
| stale  | number            | -      | TTL 过期后继续提供陈旧数据的时间（秒） |
| all    | boolean           | false  | 缓存所有 resolver（与 policy 二选一）  |
| policy | object            | {}     | 指定哪些 Query/Mutation 需要缓存       |

```ts
// 读取 GraphQL Schema
const typeDefs = readFileSync(join(__dirname, '../src/graphql/schema.graphql'), 'utf-8');

// 注册 Mercurius
await app.getHttpAdapter().getInstance().register(mercurius, {
   schema: typeDefs,
   resolvers,
   graphiql: true // 启用 GraphQL Playground
});

// //插件policy配置对象
// interface PolicyFieldOptions {
//   ttl?: number | TtlFunction;        // 缓存有效时间
//   stale?: number; // 过期后仍返回旧数据的宽限期，也就是在ttl+stale时间内，仍然返回过期数据，同时后台会刷新缓存
//   storage?: ...;                      // 存储方式
//   extendKey?: Function; // 自定义缓存 key
//   skip?: Function; // 跳过缓存
//   invalidate?: Function; // 自定义失效逻辑
//   references?: Function; // 关联缓存
// }

// 注册 Mercurius Cache 插件
await app.register(MercuriusCache, {
   // all: true, // 决定是否全部缓存query

   //缓存策略
   policy: {
      Query: {
         //缓存全部users查询结果，ttl为60秒
         users: {
            ttl: 60
         }

         // ================================================  细粒度控制 =====================================
         //!注意：如果这个字段和其他的字段关联了，那么就需要加上references，否则就会有前端拿到过期数据

         //细粒度缓存，只缓存user查询getUserInfo字段
         // getUserInfo: {
         //   ttl: 60,
         //   skip: (_source: unknown, args: unknown, context: any) => {
         //     return context.role === 'admin'; // 管理员跳过缓存，每次查最新
         //   },
         // },

         //更加细粒度缓存，只缓存特定用户的查询结果
         // user: {
         //   ttl: 60,
         //   // !注意：这里必须要加上extendKey，否则就会把所有用户的查询结果都缓存起来，导致数据混乱
         //   //  只缓存特定用户
         //   //     extendKey: (_source, args) => args.userId,
         // },
      }
   }
});
```

::: warning 注意
类型不匹配会缓存错误 - 如果 resolver 返回与 schema 不匹配的类型，错误结果也会被缓存
:::

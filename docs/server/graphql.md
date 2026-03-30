---
outline: deep
---

# GraphQL

graphQL统一用`POST`请求，即使是`GET`。主要是如果是用`GET`请求，query查询很容易超过浏览器URL长度（2048）。

因此统一采用了`POST`请求，因此`GET`请求缓存没用了，因此需要在客户端中进行缓存，如果需要缓存的前提下。

> [!IMPORTANT] 重要
> graphQL最重要的一大优势就是便利性，例如它可以直接查询`user`相关联的实体`other1`和`other2...`等等，就免去了拿到了`user`要去对应表中再次查询，但是这样数据库查询次数会变多，本质上也就是拿数据库的查询次数去简化开发的便利性。

```graphql
type User {
   id: Int!
   name: String
   other1: Other1! # one - one
   other2: [Other2!] # one - many
}

type Other1 {
   id: Int!
   userId: Int!
   user: User! # 反向关联，用来确定是否通过other1去反向查询用户，根据需要添加即可
   # some filed....
}
type Other2 {
   id: Int!
   userId: Int!
   # some filed....
}
```

上述由于GraphQL的默认字段解析器，如果数据库返回的`user`对象不带`other1`...的话，就必须手动写一个User.Other1 resolver来做关联查询，用GraphQL自动生成器也是一样的。

::: danger 危险
虽然graphQL支持循环引用，但是前端查询的时候最好不这样做，这样会有调用地狱问题还有性能问题（响应体积爆炸）。

因此根据需要最多嵌套3层即可，其他的也没必要嵌套那么多。
:::

::: tip 提示
这个便利性就是自动化了：假如有一个`user`表和一个`other1`....表，然后需要先拿到userId然后根据userId去查询每个用户对应的`other1`...等等，这样的查询次数也是**N+1** 这里的N指的是与用户相关联的实体个数。
:::

## 流程

```
请求 -> 解析 -> 验证 -> 执行(Execute)

- 解析：解析为AST抽象语法树，检查语法是否正确。
- 验证：检查AST与schema字段是否存在和匹配等，如果存在AST中有schema中没有字段就报错。
- 执行：GraphQL 引擎按照**字段解析链 (Resolver Chain)** 逐层执行。也即逐个字段执行

```

## 服务端（fastify）

以该框架使用`mercurius`为例，

```sh
pnpm add mercurius
```

### 缓存问题

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

### 开启缓存

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

### N+1问题

该问题本质是：**graphQL解析器** 缺乏全局视角，它不知道当前的实体需要哪一个所依赖的实体，导致不知道可以一次性把所有有关依赖的实体查出来，最终导致每个节点独立发起一次数据库查询，而不是批量一次性获取。

因而可以从问题源头出发：将多次独立的按需加载合并为一次批量查询，并且同一请求内自动去重缓存。

这里可以选用`dataloader`去解决这个问题，但是这个`dataloader`核心机制是基于Nodejs的事件循环微任务队列的——将tick请求全部搜集起来利用去重缓存和批处理统一管理，因而在不是nodejs环境下可以选用别的。

::: warning 注意
由于这个`n+1`问题解决聚焦多次独立请求，同时这个`dataloader`只聚焦解决这个问题，如果还需要缓存只关注应用层面在应用层面解决即可。

如果是`mercurius-cache `注意缓存key和缓存依赖，因为每个用户的缓存key和每个用户的依赖other1...不应该相同，同时当缓存失效的时候相关的缓存依赖关系应该也要去失效。例如：

```
policy: {
  Query: {
    users: { ttl: 60 },
  },
  User: {
    Other1: {
      ttl: 60,
      extendKey: (parent) => parent.id,     // 区分不同用户的缓存
      references: ['Query.users'],           // users 失效时，Other1 跟着失效
    },
  },
}

```

:::

## 客户端（apollo）

### 归一化缓存

为啥apollo要选用归一化缓存而不是其他，主要是如果每个查询都独立的时候那么修改一份查询另一份查询就过期了例如:

```js
query1: { user: { id: "1", avatar: "new.jpg" } }
query2: { user: { id: "1", avatar: "old.jpg" } } // 过期了！
```

而归一化缓存将引用进行关联同时实现扁平存储就可以解决这个问题例如：

```js
// 所有引用指向同一份数据
"User:1": { id: "1", avatar: "new.jpg" }  // 只存一份
```

还一种就是使用了这个 Persisted Queries（白名单模式） 也就是将graphQL的前端的请求query放到后端，然后前端只需传递参数即可，使得原本一大串query简化为hash和参数体。

::: tip 提示
这个**APQ**（Automatic Persisted Queries）在一开始的时候会发送hash，后端没有初始化的时候会返回`PersistedQueryNotFound`，而后第二次的时候会进行重试然后会发生query+hash给后端，后端然后再进行映射和存储。

这个**APQ**本质上是用来减少query请求大小（将query直接转化为hash，cdn或者后端针对hash找到映射结果）以及用于cdn缓存加速（query参数基本上变化不大结果可以直接存储下来，然后将数据直接返回给前端，这样多次相同请求不会直接请求到后端），避免多个用户相同query请求触发多次造成资源浪费，也是用数据的时效性换取资源的利用率。

但是由于graphQL默认是`POST`所以将这个 query 查询转化为`Get`的时候，如果不用 cdn 那么就完全没必要，query的相关信息在body里面虽然将其转化hash去映射query然后传递参数这样确实能够减少网络带宽，但是在现代网络发达的时候减少的微小带宽没有必要，但是cdn就不一样了，cdn是直接存储相关hash和数据，减少数据库带宽和cpu的压力。
:::

::: warning 注意
客户端也可以不用apollo的 Persisted Queries 但是需要自己手动去实现，手动实现的效果就与这种开箱即用的方式就违背了。

还有就是这个**persisted**在客户端开启的时候，那么后端也要针对这个**persisted**进行支持或者认识，或者使用**redis**也是可以的。

同时apollo针对**APQ**的version版本是固定为1，这是一个协议协商机制，表示:

- hash 算法固定为SHA-256
- hash字段名固定为sha256Hash
- 回退机制：当收到PersistedQueryNotFound 说明后端找不到这个hash此时客户端（前端）会再次发送query+hash
  :::

### link中间件

类似`express`的中间件一样，不过这个是在客户端中因此不需要担心并发和耗时问题，

默认链:

```
  [1. ErrorLink]  →  [2. QueryBatcher]  →  [3. HttpLink]
    错误处理           批量合并请求           发HTTP请求
```

这里可以做请求重试例如：

```
[1. ErrorLink]  →  [2. RetryLink]  →  [3. QueryBatcher]  →  [4. HttpLink]
  全局错误处理      请求自动重试       批量合并GraphQL请求      发送HTTP请求
```

同时也可以用link三元表达式，例如只针对query进行**PQS**(Persisted Queries)，放弃对mutation的PQS因为mutation走get hash query的话完全没必要:

```ts
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { PersistedQueryLink } from '@apollo/client/link/persisted-queries';

import { sha256 } from 'crypto-hash';
const uri = 'http://localhost:3000/graphql';

const httpLink = new HttpLink({ uri });

const apqLink = new PersistedQueryLink({
   useGETForHashedQueries: true,
   sha256: (queryString) => sha256(queryString)
}).concat(httpLink);

export const apolloClient = new ApolloClient({
   link: ApolloLink.split(({ operationType }) => operationType === 'query', apqLink, httpLink),
   cache: new InMemoryCache()
});
```

---
outline: deep
---

# GraphQL

GraphQL 让客户端按需描述所需字段，并由服务端按照 schema 解析和执行查询。一次请求可以获取用户及其关联数据，但这不代表服务端只执行一次数据库查询。

HTTP 接口通常使用 POST；支持 GET 的服务也可以通过 URL 传递查询。GET 有利于利用 HTTP 缓存，但要考虑 URL 长度限制、敏感参数和缓存策略。客户端和服务端仍可根据需要各自设置缓存。

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

默认字段解析器会读取返回对象中对应的属性。如果 `user` 对象没有 `other1`，需要提供相应的字段 resolver 或提前加载关联数据。schema 可以存在循环引用；实际查询应按需限制深度和复杂度，避免不必要的数据库请求和过大的响应。

## 流程

请求经过三个主要步骤：

1. **解析**：将查询文本解析为抽象语法树（AST），检查语法。
2. **验证**：检查查询是否符合 schema，例如字段是否存在、参数类型是否正确。
3. **执行**：调用字段 resolver，按查询结构组装结果。

## 服务端（fastify）

Fastify 可以使用 Mercurius 提供 GraphQL 服务：

```sh
pnpm add mercurius
```

### 缓存问题

服务端缓存可以减少重复计算和数据库访问；客户端缓存可以减少重复请求。缓存方式与键的组成取决于所用库及配置，不应假设它们都按完整查询文本或仅按字段名缓存。

设计缓存时，需要检查查询参数、父对象、用户身份和权限是否会影响结果。如果不同用户可能得到不同数据，应正确区分缓存键或跳过共享缓存，并设计数据变更后的失效方式。

### 开启缓存

Mercurius 可通过 [mercurius-cache](https://github.com/mercurius-js/cache) 缓存 resolver 的结果。以下示例缓存 `Query.users` 60 秒；`schema` 和 `resolvers` 由应用提供。

```sh
pnpm add mercurius-cache
```

| 选项     | 作用                                             |
| -------- | ------------------------------------------------ |
| `ttl`    | 缓存时间，单位为秒；默认值为 0，表示不缓存       |
| `stale`  | 过期后允许返回旧数据并在后台刷新的时间，单位为秒 |
| `all`    | 为所有 resolver 启用缓存，与 `policy` 二选一     |
| `policy` | 按类型和字段配置缓存策略                         |

::: code-group-fold line-numbers

```ts [server.ts]
import Fastify from 'fastify';
import mercurius from 'mercurius';
import mercuriusCache from 'mercurius-cache';

const app = Fastify();
// schema 和 resolvers 按应用实际定义提供
await app.register(mercurius, { schema, resolvers });
await app.register(mercuriusCache, {
    policy: {
        Query: {
            users: { ttl: 60 }
        }
    }
});
```

:::

按需使用 `skip` 跳过缓存，使用 `extendKey` 区分影响结果的上下文。数据可能变更时，可配置 `references` 和失效操作；不同存储方式还需要启用相应的失效功能，具体签名和配置见插件文档。

::: warning 注意
插件缓存的是 resolver 的返回值。如果返回值不符合 schema，错误值也可能留在缓存中；修复代码后还需等待过期或主动清除。
:::

### N+1问题

查询 N 个用户后，如果每个用户的关联字段都单独查询一次数据库，就可能产生 1 次用户查询加 N 次关联查询，即 N+1 问题。关联越多，额外查询的代价越明显。

常见处理方式是批量获取关联数据，再按用户 ID 分配结果。DataLoader 可以将同一批次的加载合并，并在实例内去重；通常为每个请求创建实例，避免不同用户之间共享不适合共享的结果。DataLoader 的请求内去重不能替代有过期与失效策略的应用缓存。

## 客户端（apollo）

### 归一化缓存

如果每个查询独立保存一份用户数据，更新头像后，其他查询中的副本可能仍是旧值。Apollo Client 可以按类型和标识将实体归一化，让多个查询引用同一实体：

```js
// 多个查询引用同一份实体，字段更新后可以复用
"User:1": { id: "1", avatar: "new.jpg" }
```

具体合并与读取行为取决于实体标识和缓存策略；缺少合适的标识时需要配置。

持久化查询（APQ）用查询的哈希减少重复传输的查询文本。客户端先发送哈希；服务端未命中时返回 `PersistedQueryNotFound`，客户端再发送完整查询及哈希，供服务端记录。Apollo APQ 协议版本 1 使用 SHA-256。客户端和服务端都需要支持该协议；共享存储可用于多实例共享查询映射。

APQ 主要减少请求大小。将符合条件的查询通过 GET 发送后，也可以配合正确配置的 HTTP 缓存或 CDN。缓存能否共享、何时失效以及私有数据如何隔离，都需要单独设计。**APQ 不等同于白名单**：默认回退允许提交服务端尚未记录的查询；限制可执行操作需要另行配置白名单。

### link中间件

Apollo Link 用链式方式处理请求，例如依次进行错误处理、重试和 HTTP 请求。下图是按需组合的示意，并非默认链：

```text
ErrorLink → RetryLink → HttpLink
错误处理    自动重试     发送请求
```

也可以使用 `ApolloLink.split` 为不同操作选择链。下面仅对 query 使用持久化查询链，mutation 仍走普通 HTTP 链：

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

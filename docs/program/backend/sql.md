---
outline: deep
---

# SQL

Prisma 可以通过类型化客户端访问数据库，并管理数据库 schema 和迁移。

## prisma

Prisma 将数据模型映射为客户端 API，适合常规的增删改查和类型安全需求。复杂查询可以结合原生 SQL；是否有性能问题应结合生成的 SQL、索引和实际负载测量，而不是仅凭是否使用 ORM 判断。

### prisma使用

迁移文件可以记录变更摘要和回滚方案，便于审查。下面用 Husky 在提交前检查暂存区中的迁移文件是否有约定的注释头；检查本身不改写文件，也不会自动暂存其他改动。

```sh
pnpm add --save-dev husky
pnpm exec husky init
```

编辑 `.husky/pre-commit`：

```sh [pre-commit]
#!/bin/sh

git diff --cached --name-only --diff-filter=ACM -- 'prisma/migrations/**/migration.sql' |
while IFS= read -r file; do
  if ! git show ":$file" | grep -q '^-- -----------sh 脚本生成----------------'; then
    printf '迁移文件缺少注释头：%s\n' "$file" >&2
    exit 1
  fi
done
```

路径和注释格式可按项目约定调整。只检查暂存区并不等于验证 SQL 或回滚方案；提交前仍需审阅迁移内容。

生成迁移后，可以对尚未应用的新迁移运行下面的脚本，再手动填写变更摘要和回滚方案。脚本只修改参数指定的文件，不会自动暂存。

```sh
#!/bin/bash
set -eu

file=${1:?请指定需要添加注释的 migration.sql 文件}
if [ ! -f "$file" ]; then
  printf '文件不存在：%s\n' "$file" >&2
  exit 1
fi
if grep -q '^-- -----------sh 脚本生成----------------' "$file"; then
  printf '文件已有注释头：%s\n' "$file"
  exit 0
fi

migration_id=$(basename "$(dirname "$file")")
tmp=$(mktemp "${file}.XXXXXX")
trap 'rm -f "$tmp"' EXIT
{
  printf '%s\n' '-- -----------sh 脚本生成----------------'
  printf '%s\n' "-- 迁移ID: $migration_id"
  printf '%s\n' "-- 创建日期: $(date +'%Y-%m-%d %H:%M:%S')"
  printf '%s\n\n' '-- 变更摘要:' '-- 回滚方案:'
  cat "$file"
} > "$tmp"
mv "$tmp" "$file"
```

例如，将脚本保存为 `scripts/add-migration-header.sh` 后，对新迁移运行：

```sh
bash scripts/add-migration-header.sh prisma/migrations/20260101000000_init/migration.sql
```

提交检查中的迁移目录以项目根目录的 `prisma/migrations` 为例，使用其他路径时需调整。已经应用或共享的迁移不应随意改写，通常应创建新的迁移记录后续变更。

**安装prisma**

```bash
pnpm install prisma -D

# 初始化 MySQL 数据源
npx prisma init --datasource-provider mysql --output ../generated/prisma
```

**安装prisma client**，类型安全和简化SQL

```sh:no-line-numbers
pnpm install @prisma/client
```

init prisma client

```sh:no-line-numbers
npx prisma generate
```

**最后迁移到数据库中（生产模式下使用）**

```sh:no-line-numbers
npx prisma migrate deploy
```

迁移已经应用到共享环境后，通常应新增迁移来修改数据库，而不是改写既有迁移历史。生成客户端、开发迁移和生产部署的命令及连接配置可能随 Prisma 版本变化。

Prisma 7 默认使用 `prisma-client` 生成器，需要指定 `output`；生成后应从对应目录导入客户端，而不是假设它总在 `node_modules`。旧的 `prisma-client-js` 生成器行为不同。详见 [Prisma 生成器文档](https://www.prisma.io/docs/orm/prisma-schema/overview/generators)。

### prisma打包问题

打包时，先确认项目使用的 Prisma 版本、生成器和输出路径。运行时必须能找到生成的客户端及其所需依赖；不要把“放进 `node_modules`”或“将生成目录作为本地包”当作所有版本的通用修复方式。

Prisma 7 默认生成器的示例配置：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

运行 `npx prisma generate` 后，从生成目录导入客户端。打包或部署时还要根据数据库驱动、目标平台和构建方式保留所需文件，具体参见 [Prisma Client 生成说明](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client)。

### 部署

部署前确认目标环境包含客户端及其运行时依赖，并在合适的构建步骤生成客户端。生产环境使用 `prisma migrate deploy` 应用待执行的迁移；配置数据库连接、迁移文件及权限时应遵循项目部署流程。

## 索引优化

索引用额外存储空间和写入维护成本换取更快的特定查询。应根据查询条件、排序、数据分布和执行计划选择索引；表频繁更新时尤其需要衡量写入开销。

常见索引类型：

- **普通索引**：辅助查询，不限制列值重复。
- **唯一索引**：除辅助查询外，还约束列值或组合值的唯一性；只在业务需要唯一时使用。
- **全文索引**：支持数据库提供的全文检索能力。
- **空间索引**：用于支持的地理或几何数据查询。

常见存储结构包括 B-tree 和 Hash。B-tree 常用于等值、范围及某些前缀查询；Hash 通常用于等值查询。具体支持范围与优化器行为取决于数据库和存储引擎。

下面的 TypeORM 示例为邮箱添加唯一索引，为姓氏添加普通索引：

```ts
//typeorm 索引

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column()
    email: string;

    @Index()
    @Column()
    lastName: string;
}
```

## 高频查询结果缓存

对于允许短暂读取旧数据的高频查询，可以考虑结果缓存。以下 TypeORM 示例缓存查询结果 1 秒；应用仍需根据数据变化设计缓存失效策略。

```ts
// options type (毫秒为单位)
cache: boolean | number;

//example
const selectCache = selectCacheRepo.find({
    select: {
        id: true,
        firstName: true,
        lastName: true,
        age: true
    },
    cache: 1000 //1s
});
```

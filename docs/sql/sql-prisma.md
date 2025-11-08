---
outline: deep
---

# SQL简化

在后端中，简化SQL语句的编写，和迁移的简单，这里采用prisma。

## prisma

Prisma将表看成一个对象(model)，所有操作都看作对象的操作，将SQL操作表迁移到对象操作，如果考虑**性能优化** 的情况下，使用`prisma`会有性能损失，因为它会将对象操作转化SQL有性能损失，同时如果涉及子查询、复杂SQL编写，其缺点显著。

**简单查询用ORM，复杂查询考虑性能的话回退SQL编写的混合策略**

### prisma使用

为了迁移的SQL迁移文件有更好的注释和简化注释操作，这里用husky对迁移文件自动注入**SQL头**注释信息，对于一些自定义注释则使用bash手动编写

**Install husky**

```sh
pnpm add --save-dev husky
```

**husky init**

```sh
pnpm exec husky init
```

**然后编辑git commit提交之前的hook（pre-commit）**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   pre-commit内容
</summary>

```sh
# .husky/pre-commit

# Prettier 格式化
prettier $(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g') --write --ignore-unknown

# Prisma 迁移文件添加提交信息头
find prisma/migrations -name "migration.sql" | while read -r file; do
  if ! grep -q '^-- ------github commit hooks触发---------' "$file"; then

    # 头信息
    header="-- ------github commit hooks触发---------
-- 作者: $(git config user.name)
-- 邮箱: $(git config user.email)
-- Git分支: $(git branch --show-current)
-- 关联提交: $(git rev-parse --short HEAD)
-- 提交日期: $(date +'%Y-%m-%d %H:%M:%S')
"
    # 插入头
    echo "$header" | cat - "$file" > temp && mv temp "$file"
    echo "✅ 已为 $file 添加Git提交头"
    git add "$file"
  fi
done

#  更新 Git 索引
git update-index --again
```

</details>

**创建自定义的sh，在生成迁移完后执行自动添加自定义信息**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   自定义头配合github commit
</summary>

```sh
#!/bin/bash

# 严格符合以下格式：
# -- -----------sh 脚本生成----------------
# -- 迁移ID: [migration文件夹名称]
# -- 创建日期:[sh脚本创建日期]
# -- 变更摘要: [变更摘要]
# -- 回滚方案: [回滚方案]

MIGRATIONS_DIR="prisma/migrations"

find "$MIGRATIONS_DIR" -name "migration.sql" | while read -r file; do
  # 检查是否存在标准头信息
  if ! grep -q '^-- -----------sh 脚本生成----------------' "$file"; then
    migration_id=$(basename "$(dirname "$file")")
    header="-- -----------sh 脚本生成----------------
-- 迁移ID: $migration_id
-- 创建日期: $(date +'%Y-%m-%d %H:%M:%S')
-- 变更摘要:
-- 回滚方案:

"
    # 插入头信息到文件开头
    echo "$header" > temp_file
    cat "$file" >> temp_file
    mv temp_file "$file"

    echo "✅ 已为 $file 添加标准注释头"
  fi
done
```

</details>

<span class="text-red-400">
   注意上面两个插入SQL头注释的prisma目录，按照实际目录进行更改，这里是以prisma/migrations（项目根目录下）
</span>

**安装prisma**

```terminal
pnpm install prisma -D

<!-- init -->
npx prisma init --datasource-provider mysql --output ../generated/prisma
```

**安装prisma client**，类型安全和简化SQL

```sh
pnpm install @prisma/client
```

init prisma client

```sh
npx prisma generate
```

**最后迁移到数据库中（生产模式下使用）**

```sh
npx prisma migrate deploy
```

针对prisma中迁移历史，可以进行更改，但是前提是要保证该更改不会影响其它表，这样做会造成历史混乱，所以直接使用**前驱**修改，也即增加一个前驱历史这个历史删除或者修改之前的表。

**注意：**，由于prisma7中output必填，导致**Prisma客户端**被生成到了指定的ouput目录中，而每次npx prisma generate 的时候会变化，当使用自定义引入类型文件时注意引入的生成路径。该方法解决客户端类型报错问题。`import { PrismaClient } from '../generated/prisma/index';`其中**后面的from对应output中的路径**

### prisma打包问题

**esbuild打包问题**

如果在prisma手动配置了output位置不是`node_modules`，`@prisma/client`包在运行时动态查找时会导致找不到这个模块，**同时在项目中直接引入@prisma/client包找不到任何东西**

虽然可以手动引入prisma生成的client但是esbuild进行打包运行就会报错模块找不到问题，一个简单方法**直接默认或者手动生成进node_modules目录**与@prisma/client动态查找包就会生效，esbuild配置也简单。<span class="text-red-400">但是打包后的dist目录不能脱离`node_modules`,因为SQL的执行依赖prisma client，脱离node引入模块时就会失败。</span>

**schema.prisma**

```ts

generator client {
  provider = "prisma-client-js"
  //这里很重要，也可以默认不填，但是为了更好的排除动态生成的影响还是要配置一些要好，
  //这样在部署的时候就不用担心版本和迁移问题，每次只需要删除动态生成的客户端，然后执行npx prisma generate即可
  //然后打包的时候排除这个目录即可
   output   = "../generated/prisma"

}

```

**import type问题**

`import {PrismaClient} from '@prisma/client'`这里会出错，连接问题，解决方案时在`package.json`中的dependencies中添加:

```json
"dependencies": {
   //....
   +
   "prisma-client": "file:./generated/prisma"
},
```

然后执行`pnpm i`链接到这个包既可以正常导入了

如果嫌弃上诉过程麻烦，也可以在构建时执行`pnpm add <url>`,这个url指向构建好的PrismaClient，注意地址问题，也就是这个url工作目录也就是当前工作目录是处于`项目根目录的`

### 部署

部署的时候将打包好的`dist`文件传递到服务器中，注意这个prisma的配置和历史文件，因为这里的动态生成prisma客户端依赖这个schema.prisma文件，然后执行npx prisma generate生成一下即可

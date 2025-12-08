---
outline: deep
---

# Monorepo架构

将多个项目集中化、关联到一个Git仓库，公共模块抽离，自动构建流程优化。

- 将多个项目代码存储在一个单一版本仓库的架构模式。（**单一仓库**）。
- 所有项目共享同一个仓库，且所有版本控制都存储在同一个**Git**仓库中。
- 项目共享相同依赖库，不同项目之间可以共享和重用代码（**通过pnpm软链接**）

`主要就是解决传统分布式单一项目缺点：`

- 项目分散，集中管理困难
- 每次要运行都要分开运行
- 打包构建也要分开构建打包部署
- 最终要一点是**代码逻辑重复**，特别是类型、还有依赖

## TSConfig配置注意事项

::: warning composite和noEmit

在tsconfig被`references`的项目在被引用一方按需配置`composite`，它会生成.tsbuildinfo文件，
同时输出编译产物，因此此时**noEmit必须要设置true**

同时如果是monorepo管理项目将ts配置单独抽离出来包的话，并且使用`files`进行暴露，那么此时就**必须配置composite**

:::

## 构建

在`monorepo`中，这里主要讨论**packages打包**，不考虑应用打包，应用打包可以选用[webpack](https://www.webpackjs.com/)，或者[vite](https://cn.vitejs.dev/)，[rolldown](https://rolldown.rs/guide/introduction),[rollup](https://cn.rollupjs.org/introduction/)等即可。

> 在`package.json`中，可以根据需要**是否兼容老标准**配置`main`和`module`字段，向后兼容。实际上配置`export`就即可。

### 选型指南

库打包等非应用打包，这里主要就是将`ts->js`然后生成对应`.d.ts`，`静态资源迁移`，`vue->js`和类型，不过还要考虑就是这个HMR热更新，和开发体验。
下面主要讨论`tsup` 和 `unbuild`工具用于打包。

### tsup

::: tip tsup
配置简单，只需要定义`tsup.config.ts`即可，然后进行配置 [tsup](https://tsup.egoist.dev/#usage)。例如：

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
   entry: ['src/index.ts'], //入口文件
   splitting: false, //代码分割
   sourcemap: false, //源码地图
   clean: true, //构建前清理dist目录
   dts: true, //dts生成
   format: ['esm', 'cjs'], //格式
   publicDir: 'src/assets', //资源目录
   outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.cjs',
      dts: '.d.ts'
   })
});
```

但是针对静态文件资源处理是以目录为准`publicDir`,也就意味着包中所有的静态资源放在一个目录中。

相比`unbuild`的`mkdist`构建器专门用于解决文件处理，不过它要配置pattern进行匹配。

:::

::: warning 注意
tsup**不好**的就是热更新HMR，虽然提供了watch，使用`tsup --watch`可以实现，但是这会单独创建一个终端进行监听，如果有多个包情况下会导致多个终端开发体验不好。如果不采用热更新HMR那么修改完包后必须要重新打包:pensive:

不过可以在`package.json`配置`development`导出可以解决这个问题

```json
{
   "exports": {
      ".": {
         "types": "./dist/index.d.ts",
         "development": "./src/index.ts", //[!code ++]
         "import": "./dist/index.mjs",
         "require": "./dist/index.cjs"
      }
   }
}
```

:::

#### 配置Options

[tsup完整配置](https://tsup.egoist.dev/#usage)

| 配置项       | 类型                                       | 默认值     | 说明                 |
| ------------ | ------------------------------------------ | ---------- | -------------------- |
| entry        | string[] \| Record<string, string>         | 自动推断   | 构建入口             |
| format       | 'cjs' \| 'esm' \| 'iife' \| Format[]       | ['cjs']    | 输出格式             |
| outExtension | ctx \=\> \{ js?: string; dts?: string \}   | -          | 自定义文件拓展名     |
| minify       | boolean \|'terser'                         | -          | 压缩代码             |
| dts          | boolean \| string \| DtsConfig             | -          | 类型声明文件         |
| splitting    | boolean                                    | ESM:`true` | 代码分割             |
| treeshake    | TreeshakingStrategy                        | -          | Rollup树摇           |
| sourcemap    | boolean \| 'inline'                        | -          | 源码地图             |
| watch        | boolean \| string \| (string \| boolean)[] | -          | 监听                 |
| ignoreWatch  | string[] \| string                         | -          | 忽略监听的文件       |
| clean        | boolean \| string[]                        | -          | 构建前清理输出目录   |
| silent       | boolean                                    | -          | 静默模式，不输出日志 |

### unbuild

::: tip unbuild

内部使用`esbuild`进行转译，而后使用`rollup`进行产物优化，支持`mkdist`映射文件到文件。

`mkdist`优势:**保留源码的目录结构**，如果是ts->js（TS文件->JS文件）且需要保留目录结构，此时`mkdist`就比默认的`rollup`非常适合。例如:（定义`build.config.{js,ts}`即可，然后配置如下）

```ts
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
   entries: [
      // 处理 Vue 文件，需要vue-tsc支持
      {
         builder: 'mkdist',
         input: './src',
         loaders: ['vue'],
         pattern: ['**/*.vue']
      },
      // TS->JS 转换
      {
         builder: 'mkdist',
         input: './src',
         format: 'esm',
         loaders: ['js'],
         pattern: ['**/*.ts']
      }
   ],
   declaration: true,
   clean: true
});
```

与**tsup**的区别最大优势是`stub`模式，它会生成一个桩文件直接指向源代码，这个桩文件使用`jiti(得益其即时编译能力，跳过构建执行源码)`直接运行ts文件，无需重新构建就能看得见更新，开发体验很好:relaxed:

启用stub模式，只需在项目安装时，执行`pnpm -r run stub --if-present`，避免手动一个一个包去执行stub，如果是单独包热更新只需执行`unbuild stub`即可。
:::

::: warning 注意

`unbuild` 默认使用**rollup**作为构建器(builder)。

同时stub模式需要区分**开发和生产**模式下的`package.json`导出配置

:::

#### 配置Options

| 选项                                                     | 类型                 | 默认值   | 说明           |
| -------------------------------------------------------- | -------------------- | -------- | -------------- |
| entries                                                  | BuildEntry[]         | 自动推断 | 构建入口       |
| outDir                                                   | string               | "dist"   | 输出目录       |
| clean                                                    | boolean              | true     | 构建前清理     |
| declaration                                              | boolean \| string    | auto     | 类型声明       |
| sourcemap                                                | boolean              | false    | 生成 sourcemap |
| stub                                                     | boolean              | false    | 开发模式       |
| watch                                                    | boolean              | false    | 监听模式       |
| externals                                                | (string \| RegExp)[] | []       | 外部依赖       |
| alias                                                    | object               | {}       | 路径别名       |
| replace                                                  | object               | {}       | 文本替换       |
| failOnWarn                                               | boolean              | false    | 警告时失败     |
| parallel                                                 | boolean              | false    | 并行构建       |
| [rollup](https://cn.rollupjs.org/configuration-options/) | RollupBuildOptions   |          | rollup配置选项 |

## 依赖注意

::: danger 特别注意

由于第三方包的前置依赖重合的问题，因此实际开发注意锁定版本，以此避免版本不一致问题一。

例如:

- esbuild: `tsup`，`unbuild`，`vite`，`rolldown`等间接依赖**esbuild**
- eslint: eslint的插件等peer对等依赖

eslint由于第三方开发者更新的原因，因此版本不一致问题是正确的。

:::

::: tip 提示

可以使用`pnpm why esbuild`进行分析。但出现不一致的时候可以强制锁定版本，例如锁定最新版本。

```jsonc
//package.json
{
   "pnpm": {
      "overrides": {
         "esbuild": "^0.27.0" //间接依赖，锁定最新版本
      }
   }
}
```

:::

## Turborepo速通

turborepo根据锁文件来理解项目中不同包之间的依赖，

::: danger 危险

当一个包去引用另外一个包的文件的时候，应该是导入这个包进行访问，而不是使用路径访问，例如`./`，否则会违背`模块块思想`，且不好维护。

:::

### 配置任务

| 配置   | 作用         | 作用范围       | 执行流程           | 描述                                           |
| :----- | :----------- | :------------- | :----------------- | :--------------------------------------------- |
| build  | 全工作区串行 | 全工作区所有包 | 完全串行           | 所有包的 build 都要等待所有其他包的 build 完成 |
| ^build | 依赖链并行   | 依赖包         | 包间并行，包内串行 | 我要等我的依赖包先构建完                       |
| #build | 同包任务串行 | 同一个包内     | 包间并行，包内串行 | 我要等我这个包内的其他任务先完成               |

::: tip

**Inputs**作为`turborepo`的缓存输入，内部用哈希算法进行快照，默认是`Git`追踪文件，遵守`.gitignore`规则

**Outputs**作为`turborepo`的缓存密钥，如果不配置它，那么它不会缓存任何文件

```jsonc
//turbo.json
{
   "tasks": {
      //使用 !进行排除，例如排除cache文件，`!cache/***`
      "build": {
         //!这个input只会追踪md文件，此时会覆盖掉默认Git规则
         //TODO 保留默认规则：`"$TURBO_DEFAULT$"`加上这个即可
         "inputs": ["**/*.md"], //[!code ++]
         "outputs": ["dist/**"] //[!code ++]
      }
   }
}
```

:::

::: info 注册根任务
这个根任务就是执行根目录中`package.json`的scripts。

语法规则：`//#<任务名>`，其他用法与`task`类似

:::

### 显示依赖关系

| 命令                         | 作用       |
| :--------------------------- | :--------- |
| `turbo build --filter=...ui` | 谁用了ui库 |
| `turbo build --filter=ui...` | ui库用了谁 |

> [!IMPORTANT] 查看构建依赖关系
>
> ```sh
> turbo run build --graph
> ```
>
> **svg图片**
>
> ```sh
> turbo run build --graph="build-deps.svg"
> ```

### 常见Options详解

::: tip globalDependencies
告诉`Turborepo`，当这里面的文件发生变化时，清空所有缓存，重新构建所有包。

主要用于配置文件发生变化，和锁文件依赖发生变化重新触发构建
:::

### 运行Commands

[Turborepo Commands](https://turborepo.com/docs/reference/run)

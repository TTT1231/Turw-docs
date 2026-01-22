# claude

## plugins/skill/agents

- plugins 一些系列`skill`和`sub agents`集合
- skill 用于拓展`LLM`在特定任务上的能力，例如ui/ux skill
- agents 任务专家，专门处理特定任务，例如前端任务

三者都可以自动触发和手动触发。

### 常用插件

这里是展示常用插件，用于提示和帮助快速编码。

[完整官方插件](https://github.com/anthropics/claude-plugins-official)

|        名称         |                          描述                          |
| :-----------------: | :----------------------------------------------------: |
|    `feature-dev`    | 完整功能开发工作流，包含代码探索、架构设计、质量审查等 |
|  `frontend-design`  |            创建高质量前端界面，生成创意代码            |
|    `code-review`    |        自动PR代码审查，一致性、清晰度和可维护性        |
|  `code-simplifier`  |          简化和重构代码，不会修改代码原始逻辑          |
| `pr-review-toolkit` |    PR审查工具包，专注注释、测试、错误处理和代码质量    |
|  `commit-commands`  |                     Git工作流命令                      |
|       `figma`       |   Figma集成，设计稿转代码。<mark>需要Api key</mark>    |
|    `playwright`     |                    游览器自动化测试                    |
|    `ralph-loop`     |               用于AI反复迭代，而不会中断               |

## LSP

`LSP`一种开放协议，定义IDE与LLM之间的通信标准。`-lsp`添加的时候提供了整个项目的地图和语言级语义分析，为`LLM`提供项目索引、符号查询、依赖追踪等，使得能够精确跳转定义、查找引用等。

而且没有`-lsp`的时候，想要定义到具体逻辑的时候，`LLM`会去搜索文件，以此找到相关逻辑和影响，但这很可能会漏掉依赖特别是模块间依赖，同时会去加载整个项目导致思考时间长Token使用多(没有特定按需加载，也就是只加载对应模块和代码)，造成逻辑缺失。

::: tip 提示
`-lsp`前面加上`-`，这里是指的是已经提供了`LLM`的特定场景支持。例如`typescript-lsp`等等。
:::

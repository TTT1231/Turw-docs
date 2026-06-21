---
outline: deep
---

# CLAUDE

## plugins/skill/agents/workflow/scripts

- plugins 用于编排一系列 `skill`、`agent`
- skill 用于拓展专业技能
- agent team 协作 agent 流程可沉淀和规则
- sub agent 用于快速解决任务，沉淀不了规则和流程
  三者都可以自动触发和手动触发。
- workflow 用来编排**流程**避免agent遗漏某些流程的执行（harness）
- scripts 用来解决agent依靠硬prompt遗忘和不遵守问题

::: tip skill meta
`claude skill meta`支持以下常用字段等:

| 字段                       |          示例           | 说明                                                                                                       |
| :------------------------- | :---------------------: | :--------------------------------------------------------------------------------------------------------- |
| `description`              |       `skill描述`       | 描述 skill 干什么、什么时候用，Claude 靠它判断是否自动触发；与 `when_to_use` 合计在列表里截断在 1,536 字符 |
| `argument-hint`            |         `arg1`          | 自动补全时显示的参数提示                                                                                   |
| `arguments`                |          `id`           | 命名位置参数（用于 `$name` 替换），空格分隔字符串或 YAML list                                              |
| `disable-model-invocation` |         `true`          | 设为 `true` 禁止 Claude 自动触发，只能手动 `/name` 调用                                                    |
| `user-invocable`           |         `false`         | 设为 `false` 从 `/` 菜单隐藏（只让 Claude 调用，如背景知识类 skill）                                       |
| `allowed-tools`            | `Bash(git add:*), Read` | 激活期间免确认使用的工具。⚠️ 只是"预授权"，**不限制** Claude 只能用这些工具                                |
| `disallowed-tools`         |       `WebFetch`        | 激活期间从工具池里移除的工具（下一条消息后失效）                                                           |
| `model`                    |  `inherit` / `sonnet`   | 激活期间用的模型，值同 `/model`，或 `inherit` 继承主会话                                                   |
| `effort`                   |         `high`          | 推理强度：`low`/`medium`/`high`/`xhigh`/`max`                                                              |
| `context`                  |         `fork`          | 设为 `fork` 时在隔离的 subagent 上下文里运行                                                               |
| `paths`                    |       `**/*.tsx`        | glob 模式（逗号分隔或 YAML list），仅当操作匹配文件时 Claude 才自动加载该 skill                            |

:::

::: tip 插件和skill参考

[official-plugin](https://github.com/anthropics/claude-plugins-official/tree/main)

[officialMember-skill](https://github.com/ComposioHQ/awesome-claude-skills)

:::

## worktree

`Worktree` 允许在同一个仓库中检出多个分支到不同目录，而后管理这个`worktree`目录即可，在这个目录中跟`Git`一样使用即可，最后在合并到主分支即可。

claude结合`worktree`可以实现并行任务并发，从而单个任务失败或者成功在不合并到主分支之前，对主分支不会造成任何影响。

::: tip 提示

```bash
claude -w feat/refactor
```

上面停止退出的时候，如果选择了退出会将整个`worktree`和`branch`全部删除掉。
:::

## permission

`claude`的相关`permission`主要是一些命令和权限的执行权限，例如允许和禁止：允许代表命令不需要进行授权，而禁止代表命令默认禁止。

::: info 例如

使用通配符`*`表示匹配任意值，但是**复合命令**不会去匹配例如（`&&`、`||`、`|` 、`;`）。

但是可以选用`:*`这种去专门处理，例如`Bash(git *:*)`匹配 git 开头 + 后面允许接 && 之类的链。

还可以使用`Toolname(param:value)`可匹配工具入参（支持 `*` 通配符），如 `Agent(model:opus)`表示派出去的`subagent`不能使用`opus`模型。

- agent的param常见的有：`model`、`subagent_type`
- tool的param常见的有：`Read`、`Bash`、`WebFetch`、`WebSearch`

```json
{
   "permissions": {
      "allow": ["Read(*)", "Bash(git *:*)"],
      "deny": ["Agent(model:opus)", "Read(file_path:*.env)", "Glob(pattern:**/secrets/**) "]
   }
}
```

:::

还有一种就是hooks的权限，主要有**工具级**（Pre/PostToolUse,带 matcher）和**事件级**（其他,不带matcher）

::: tip hooks
常用的hooks主要有`PreToolUse`、`PostToolUse`、`Stop`，这些hooks主要是安全防护、自动化收尾、完成通知等常见操作。配置示例如下：

```json
{
   "hooks": {
      "SessionStart": [
         {
            "hooks": [{ "type": "command", "command": "echo '欢迎回来!'" }]
         }
      ],

      "PreToolUse": [
         {
            "matcher": "Bash",
            "hooks": [{ "type": "command", "command": "node ~/.claude/guard.js" }]
         }
      ],

      "PostToolUse": [
         {
            "matcher": "Write",
            "hooks": [{ "type": "command", "command": "npx prettier --write ." }]
         }
      ],

      "Stop": [
         {
            "hooks": [{ "type": "command", "command": "pwsh -c 'lark-cli ...'" }]
         }
      ],

      "Notification": [
         {
            "hooks": [{ "type": "command", "command": "pwsh -c '播放提示音'", "async": true }]
         }
      ]
   }
}
```

:::

::: tip hookify插件
原生再写hook的时候要写的`command`门槛高，要写shell、脚本等，还需要去关注字符转义、跨平台兼容等，因此claude提供一个`hookify`插件：规则即文档。

这个插件本质上是“配置化”思想，根据规则和需要自动注册`PreToolUse`、`PostToolUse`、`Stop`、`UserPromptSubmit`相关钩子，通过**md**来简化hook的规则和代码分离。
:::

## sanbox

### allowAppleEvents（Mac）

主要允许沙箱命令可以打开网页链接，和使用`osascript`执行`AppleScript`脚本以及自动化控制任务。

```json
{
   "sandbox": {
      "allowAppleEvents": true
   }
}
```

## 功能

### footerLinksRegexes

自动识别文本中的外部链接，用于快速上下文切换。

| 字段      | 必填 | 说明                                                                                                       |
| :-------- | :--: | :--------------------------------------------------------------------------------------------------------- |
| `pattern` |  是  | 正则表达式模式，**必须含命名捕获组**。示例：`\b(?<key>[tT][uU]?[rR][wW])\b`                                |
| `url`     |  是  | URL 模板，用 `{name}` 占位符从捕获组填充（固定地址可不引用）。示例：`https://ttt1231.github.io/Turw-docs/` |
| `type`    |  是  | 必须设为 `"regex"`                                                                                         |
| `label`   |  否  | 自定义徽章显示文本                                                                                         |

```json
{
   "footerLinksRegexes": [
      {
         "type": "regex",
         "pattern": "\\b(?<key>[tT][uU]?[rR][wW])\\b",
         "url": "https://ttt1231.github.io/Turw-docs/",
         "label": "Turw-docs"
      }
   ]
}
```

::: tip
`[uU]?` 让 `u` 可选 → `turw`/`TURW`/`trw`/`Turw` 等大小写组合全部命中；`url` 为固定地址，不引用 `{key}` 也跳同一页面。
:::

::: warning
Windows 下终端点击 / `Ctrl+左键` 无效时，设置环境变量 `$env:FORCE_HYPERLINK = "1"`。
:::

### enforceAvailableModels

增强模型访问控制，确保用户无法绕过 `availableModels` 白名单（需 **v2.1.175+**）。

| 状态                               | Default 解析规则                                                   | 可绕过？ |
| :--------------------------------- | :----------------------------------------------------------------- | :------: |
| 未启用                             | `Default` = 订阅层级默认模型，**不受** `availableModels` 影响      |    是    |
| 启用 `enforceAvailableModels:true` | `Default` 必须命中白名单；订阅默认不在白名单时回退到**白名单首项** |    否    |

```json
{
   "model": "claude-sonnet-4-5",
   "availableModels": ["claude-sonnet-4-5", "haiku"],
   "enforceAvailableModels": true,
   "env": {
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-5"
   }
}
```

::: tip

- `enforceAvailableModels` → 让 **Default** 遵守白名单。
- `env` 块（如 `ANTHROPIC_DEFAULT_SONNET_MODEL`）→ 锁定**别名**解析到的**具体版本**。
  :::

::: warning

- 在管理/策略设置中定义时，管理值**完全替换**低优先级值（v2.1.175 起强制严格白名单的唯一方式）。
- `availableModels: []`（空数组）**永不**生效，用户仍可用订阅层级 Default。
  :::

### wheelScrollAccelerationEnabled

控制全屏模式滚轮的**加速行为**（需 **v2.1.174+**）。

| 值             | 表现                               | 适合                          |
| :------------- | :--------------------------------- | :---------------------------- |
| `true`（默认） | 随滚动速度**加速**，快速转动跳更远 | 习惯原生加速                  |
| `false`        | 每次滚动**恒定距离**，线性可预测   | 嫌加速过冲、高灵敏触控板/鼠标 |

```json
{
   "wheelScrollAccelerationEnabled": false,
   "env": {
      "CLAUDE_CODE_SCROLL_SPEED": "3"
   }
}
```

::: tip
`CLAUDE_CODE_SCROLL_SPEED`（基础距离，1–20）与加速开关相互独立：`1–2` 精读、`3–5` 日常、`6+` 快速翻阅。
:::

### disableBundledSkills

隐藏 Claude Code 内置的技能、工作流和斜杠命令（对应环境变量 `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS`）。

| 类别                                                             | 是否隐藏                 |
| :--------------------------------------------------------------- | :----------------------- |
| 内置技能/工作流（`/batch`、`/simplify`、`/code-review`、`/run`） | **隐藏**                 |
| 内置斜杠命令（`/init`）                                          | 对模型隐藏，仍可手动输入 |
| 插件 / `.claude/skills/` / `.claude/commands/` 自定义内容        | **不受影响**             |

```json
{
   "disableBundledSkills": true
}
```

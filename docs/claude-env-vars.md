# Claude Code 环境变量参考

> 全量收录自[官方 env-vars 文档](https://code.claude.com/docs/en/env-vars)（共 274 项），按用途分类。所有环境变量均可写入 `settings.json` 的 `env` 字段。

## 鉴权 / API Key / Token

| 变量                                | 默认值 | 意义                                                                                                                                                     |
| :---------------------------------- | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                 | 未设置 | 作为 `X-Api-Key` 头发送的 API key。设置后即使用户已登录订阅，也优先使用此 key；非交互模式（`-p`）下存在即用，交互模式下首次需确认。用 `unset` 可恢复订阅 |
| `ANTHROPIC_AUTH_TOKEN`              | 未设置 | 自定义 `Authorization` 头的值（会自动加 `Bearer` 前缀）                                                                                                  |
| `ANTHROPIC_AWS_API_KEY`             | 未设置 | Claude Platform on AWS 的工作区 API key（AWS 控制台生成），作为 `x-api-key` 发送，优先级高于 AWS SigV4                                                   |
| `ANTHROPIC_FOUNDRY_API_KEY`         | 未设置 | Microsoft Foundry 鉴权用的 API key                                                                                                                       |
| `AWS_BEARER_TOKEN_BEDROCK`          | 未设置 | Bedrock 鉴权用的 API key                                                                                                                                 |
| `MCP_CLIENT_SECRET`                 | 未设置 | 需要预置凭据的 MCP 服务器的 OAuth client secret，避免交互式提示                                                                                          |
| `CLAUDE_CODE_API_KEY_HELPER_TTL_MS` | 未明确 | 使用 `apiKeyHelper` 时凭据刷新间隔（毫秒）                                                                                                               |
| `CLAUDE_CODE_OAUTH_TOKEN`           | 未设置 | Claude.ai 鉴权的 OAuth 访问令牌，SDK/自动化环境下替代 `/login`，优先级高于钥匙串凭据（用 `claude setup-token` 生成）                                     |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`   | 未设置 | Claude.ai 鉴权的 OAuth 刷新令牌；设置后 `claude auth login` 直接换 token 而不开浏览器，需配合 `CLAUDE_CODE_OAUTH_SCOPES`                                 |
| `CLAUDE_CODE_OAUTH_SCOPES`          | 未设置 | 刷新令牌的 OAuth scope（空格分隔），设 refresh token 时必填                                                                                              |

## 端点 / 代理 / 路由

| 变量                                   |                        默认值                         | 意义                                                                                                              |
| :------------------------------------- | :---------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_BASE_URL`                   |                        未设置                         | 覆盖 API 端点以走代理或网关。指向非第一方主机时默认禁用 MCP 工具搜索，需 `ENABLE_TOOL_SEARCH=true` 才恢复         |
| `ANTHROPIC_AWS_BASE_URL`               | `https://aws-external-anthropic.{AWS_REGION}.api.aws` | 覆盖 Claude Platform on AWS 端点 URL（自定义区域或走网关时用）                                                    |
| `ANTHROPIC_BEDROCK_BASE_URL`           |                        未设置                         | 覆盖 Bedrock 端点 URL                                                                                             |
| `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`    |                        未设置                         | 覆盖 Bedrock Mantle 端点 URL                                                                                      |
| `ANTHROPIC_VERTEX_BASE_URL`            |                        未设置                         | 覆盖 Vertex AI 端点 URL                                                                                           |
| `ANTHROPIC_FOUNDRY_BASE_URL`           |                        未设置                         | Foundry 资源的完整 base URL，作为 `ANTHROPIC_FOUNDRY_RESOURCE` 的替代                                             |
| `ANTHROPIC_CUSTOM_HEADERS`             |                        未设置                         | 附加到请求的自定义头（`Name: Value` 格式，多个用换行分隔）                                                        |
| `ANTHROPIC_VERTEX_PROJECT_ID`          |                        未设置                         | Vertex AI 请求的 GCP 项目 ID（会被 `GCLOUD_PROJECT` 等覆盖）                                                      |
| `ANTHROPIC_WORKSPACE_ID`               |                        未设置                         | 工作负载身份联邦的工作区 ID，联邦规则跨多工作区时用于定位目标                                                     |
| `ANTHROPIC_AWS_WORKSPACE_ID`           |                        未设置                         | Claude Platform on AWS 必填，每次请求作为 `anthropic-workspace-id` 头发送                                         |
| `HTTP_PROXY`                           |                        未设置                         | 网络连接的 HTTP 代理服务器                                                                                        |
| `HTTPS_PROXY`                          |                        未设置                         | 网络连接的 HTTPS 代理服务器                                                                                       |
| `NO_PROXY`                             |                        未设置                         | 直连（绕过代理）的域名与 IP 列表                                                                                  |
| `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`     |                        未设置                         | 设为 `1` 让代理而非调用方执行 DNS 解析                                                                            |
| `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST` |                        未设置                         | 由嵌入 Claude Code 的宿主平台设置；置位后 provider 选择/端点/鉴权类变量在 settings 中被忽略，避免用户覆盖宿主路由 |
| `CLAUDE_CODE_REMOTE`                   |                         自动                          | 作为云会话运行时自动设为 `true`，可在 hook/脚本中读取以检测云环境                                                 |
| `CLAUDE_CODE_REMOTE_SESSION_ID`        |                         自动                          | 云会话中自动设为当前会话 ID，用于构造回链                                                                         |

## 云厂商提供商（Bedrock / Vertex / Foundry / Mantle / AWS）

| 变量                                    | 默认值 | 意义                                                                                       |
| :-------------------------------------- | :----: | :----------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_USE_BEDROCK`               | 未设置 | 使用 Amazon Bedrock                                                                        |
| `CLAUDE_CODE_USE_VERTEX`                | 未设置 | 使用 Google Vertex AI                                                                      |
| `CLAUDE_CODE_USE_FOUNDRY`               | 未设置 | 使用 Microsoft Foundry                                                                     |
| `CLAUDE_CODE_USE_MANTLE`                | 未设置 | 使用 Bedrock Mantle 端点                                                                   |
| `CLAUDE_CODE_USE_ANTHROPIC_AWS`         | 未设置 | 使用 Claude Platform on AWS                                                                |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH`         | 未设置 | 跳过 Bedrock 的 AWS 鉴权（如走 LLM 网关时）                                                |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH`          | 未设置 | 跳过 Vertex 的 Google 鉴权                                                                 |
| `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`         | 未设置 | 跳过 Foundry 的 Azure 鉴权                                                                 |
| `CLAUDE_CODE_SKIP_MANTLE_AUTH`          | 未设置 | 跳过 Bedrock Mantle 的 AWS 鉴权                                                            |
| `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH`   | 未设置 | 跳过 Claude Platform on AWS 的客户端鉴权（网关自行签名时用）                               |
| `ANTHROPIC_BEDROCK_SERVICE_TIER`        | 未设置 | Bedrock 服务等级（`default`/`flex`/`priority`），作为 `X-Amzn-Bedrock-Service-Tier` 头发送 |
| `ANTHROPIC_BETAS`                       | 未设置 | 追加到请求的 `anthropic-beta` 头值（逗号分隔），用于提前启用 API beta；兼容所有鉴权方式    |
| `ANTHROPIC_FOUNDRY_RESOURCE`            | 未设置 | Foundry 资源名（如 `my-resource`），未设 base URL 时必填                                   |
| `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION` | 未设置 | Bedrock/Mantle 下 Haiku 类模型使用的 AWS 区域                                              |
| `VERTEX_REGION_CLAUDE_3_5_HAIKU`        | 未设置 | Vertex AI 下 Claude 3.5 Haiku 的区域覆盖                                                   |
| `VERTEX_REGION_CLAUDE_3_5_SONNET`       | 未设置 | Vertex AI 下 Claude 3.5 Sonnet 的区域覆盖                                                  |
| `VERTEX_REGION_CLAUDE_3_7_SONNET`       | 未设置 | Vertex AI 下 Claude 3.7 Sonnet 的区域覆盖                                                  |
| `VERTEX_REGION_CLAUDE_4_0_OPUS`         | 未设置 | Vertex AI 下 Claude 4.0 Opus 的区域覆盖                                                    |
| `VERTEX_REGION_CLAUDE_4_0_SONNET`       | 未设置 | Vertex AI 下 Claude 4.0 Sonnet 的区域覆盖                                                  |
| `VERTEX_REGION_CLAUDE_4_1_OPUS`         | 未设置 | Vertex AI 下 Claude 4.1 Opus 的区域覆盖                                                    |
| `VERTEX_REGION_CLAUDE_4_5_OPUS`         | 未设置 | Vertex AI 下 Claude Opus 4.5 的区域覆盖                                                    |
| `VERTEX_REGION_CLAUDE_4_5_SONNET`       | 未设置 | Vertex AI 下 Claude Sonnet 4.5 的区域覆盖                                                  |
| `VERTEX_REGION_CLAUDE_4_6_OPUS`         | 未设置 | Vertex AI 下 Claude Opus 4.6 的区域覆盖                                                    |
| `VERTEX_REGION_CLAUDE_4_6_SONNET`       | 未设置 | Vertex AI 下 Claude Sonnet 4.6 的区域覆盖                                                  |
| `VERTEX_REGION_CLAUDE_4_7_OPUS`         | 未设置 | Vertex AI 下 Claude Opus 4.7 的区域覆盖                                                    |
| `VERTEX_REGION_CLAUDE_4_8_OPUS`         | 未设置 | Vertex AI 下 Claude Opus 4.8 的区域覆盖                                                    |
| `VERTEX_REGION_CLAUDE_FABLE_5`          | 未设置 | Vertex AI 下 Claude Fable 5 的区域覆盖                                                     |
| `VERTEX_REGION_CLAUDE_HAIKU_4_5`        | 未设置 | Vertex AI 下 Claude Haiku 4.5 的区域覆盖                                                   |

## 模型 / 别名 / 思考

| 变量                                                    |        默认值         | 意义                                                                                                                            |
| :------------------------------------------------------ | :-------------------: | :------------------------------------------------------------------------------------------------------------------------------ |
| `ANTHROPIC_MODEL`                                       |        未设置         | 使用的模型设置名                                                                                                                |
| `ANTHROPIC_CUSTOM_MODEL_OPTION`                         |        未设置         | 在 `/model` 选择器中追加的自定义模型 ID，无需替换内置别名即可选用网关专属模型                                                   |
| `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME`                    |        模型 ID        | 自定义模型在选择器中的显示名                                                                                                    |
| `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION`             | `Custom model (<id>)` | 自定义模型在选择器中的描述                                                                                                      |
| `ANTHROPIC_CUSTOM_MODEL_OPTION_SUPPORTED_CAPABILITIES`  |        未设置         | 自定义模型声明支持的能力（见模型配置）                                                                                          |
| `ANTHROPIC_DEFAULT_SONNET_MODEL`                        |        未设置         | 覆盖内置 Sonnet 别名指向的模型                                                                                                  |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`                   |        未设置         | Sonnet 别名的显示名                                                                                                             |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION`            |        未设置         | Sonnet 别名的描述                                                                                                               |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES` |        未设置         | Sonnet 别名的能力声明                                                                                                           |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`                          |        未设置         | 覆盖内置 Opus 别名指向的模型                                                                                                    |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`                     |        未设置         | Opus 别名的显示名                                                                                                               |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`              |        未设置         | Opus 别名的描述                                                                                                                 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES`   |        未设置         | Opus 别名的能力声明                                                                                                             |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`                         |        未设置         | 覆盖内置 Haiku 别名指向的模型                                                                                                   |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`                    |        未设置         | Haiku 别名的显示名                                                                                                              |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION`             |        未设置         | Haiku 别名的描述                                                                                                                |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES`  |        未设置         | Haiku 别名的能力声明                                                                                                            |
| `ANTHROPIC_DEFAULT_FABLE_MODEL`                         |        未设置         | 覆盖内置 Fable 别名指向的模型                                                                                                   |
| `ANTHROPIC_DEFAULT_FABLE_MODEL_NAME`                    |        未设置         | Fable 别名的显示名                                                                                                              |
| `ANTHROPIC_DEFAULT_FABLE_MODEL_DESCRIPTION`             |        未设置         | Fable 别名的描述                                                                                                                |
| `ANTHROPIC_DEFAULT_FABLE_MODEL_SUPPORTED_CAPABILITIES`  |        未设置         | Fable 别名的能力声明                                                                                                            |
| `ANTHROPIC_SMALL_FAST_MODEL`                            |        未设置         | [已弃用] 后台任务使用的 Haiku 类模型名                                                                                          |
| `CLAUDE_CODE_SUBAGENT_MODEL`                            |        未设置         | subagent 使用的模型（见模型配置）                                                                                               |
| `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP`                |        未设置         | 设为 `1` 阻止 Opus 4.0/4.1 在 Anthropic API 上自动重映射到当前 Opus 版本（Bedrock/Vertex/Foundry 不受影响）                     |
| `MAX_THINKING_TOKENS`                                   |        未设置         | 覆盖扩展思考 token 预算（上限为模型最大输出 token 减一）；`0` 禁用思考（Fable 5 除外）                                          |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`                 |        未设置         | 设为 `1` 在 Opus 4.6/Sonnet 4.6 上禁用自适应推理，回退到 `MAX_THINKING_TOKENS` 固定预算（v2.1.111 起对 Fable 5/Opus 4.7+ 无效） |
| `CLAUDE_CODE_DISABLE_THINKING`                          |        未设置         | 设为 `1` 从请求中完全省略 `thinking` 参数（兼容拒绝该参数的代理/网关）                                                          |
| `DISABLE_INTERLEAVED_THINKING`                          |        未设置         | 设为 `1` 不发送 interleaved-thinking beta 头（网关/提供商不支持时用）                                                           |
| `CLAUDE_CODE_EFFORT_LEVEL`                              |        未设置         | 设置 effort 等级：`low`/`medium`/`high`/`xhigh`/`max`/`auto`，优先级高于 `/effort` 与 `effortLevel`                             |
| `CLAUDE_EFFORT`                                         |         自动          | Bash/hook 子进程中自动设为本轮 effort 等级，与 hook 的 `effort.level` 一致                                                      |
| `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT`                      |        未设置         | 设为 `1` 对每个请求都发送 effort 参数（即便模型 ID 未被识别为支持 effort），用于网关/第三方自定义模型 ID                        |
| `FALLBACK_FOR_ALL_PRIMARY_MODELS`                       |        未设置         | 设为任意非空值使所有模型（不止 Opus）在无 fallback 模型时停止重试 overload 错误                                                 |
| `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE`               |         无效          | v2.1.160 起移除，原用于把 fast mode 固定在 Opus 4.6                                                                             |
| `CLAUDE_CODE_ENABLE_OPUS_4_7_FAST_MODE`                 |         无效          | v2.1.142 起移除（fast mode 默认从 4.6 迁到 4.7）                                                                                |
| `CLAUDE_CODE_DISABLE_FAST_MODE`                         |        未设置         | 设为 `1` 禁用 fast mode                                                                                                         |

## TLS / 证书

| 变量                                        |      默认值      | 意义                                                                                          |
| :------------------------------------------ | :--------------: | :-------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_CERT_STORE`                    | `bundled,system` | TLS 连接的 CA 证书来源（逗号分隔）。`bundled` 为内置 Mozilla CA 集，`system` 为操作系统信任库 |
| `CLAUDE_CODE_CLIENT_CERT`                   |      未设置      | mTLS 客户端证书文件路径                                                                       |
| `CLAUDE_CODE_CLIENT_KEY`                    |      未设置      | mTLS 客户端私钥文件路径                                                                       |
| `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`         |      未设置      | 加密私钥的口令（可选）                                                                        |
| `CCR_FORCE_BUNDLE`                          |      未设置      | 设为 `1` 强制 `claude --remote` 打包并上传本地仓库（即使有 GitHub 访问权限）                  |
| `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK` |      未设置      | 设为 `1` 禁用流式失败时的非流式回退（流式错误直接进重试层，避免网关导致重复工具执行）         |

## 超时 / 重试 / 性能

| 变量                                          |        默认值        | 意义                                                                                                                                      |
| :-------------------------------------------- | :------------------: | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `API_TIMEOUT_MS`                              | `600000`（10 分钟）  | API 请求超时（毫秒），最大 `2147483647`；超过最大值会溢出计时器并立即失败                                                                 |
| `API_FORCE_IDLE_TIMEOUT`                      |        见意义        | 覆盖流式响应 5 分钟空闲超时。未设置时：直连 Anthropic API / Claude Platform on AWS 不生效，其余提供商生效；`0`=禁用，`1`=对所有提供商启用 |
| `CLAUDE_CODE_CONNECT_TIMEOUT_MS`              |   `60000`（60 秒）   | 流式请求的建连/TLS/响应头阶段超时；超时则中止并重试，`0`=禁用仅靠 `API_TIMEOUT_MS`                                                        |
| `BASH_DEFAULT_TIMEOUT_MS`                     |  `120000`（2 分钟）  | 长时间 bash 命令的默认超时                                                                                                                |
| `BASH_MAX_TIMEOUT_MS`                         | `600000`（10 分钟）  | 模型可为 bash 命令设置的最大超时                                                                                                          |
| `CLAUDE_CODE_MAX_RETRIES`                     |         `10`         | 覆盖失败 API 请求的重试次数                                                                                                               |
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`        |         `10`         | 可并行执行的只读工具与 subagent 数上限                                                                                                    |
| `CLAUDE_CODE_MAX_TURNS`                       |        未设置        | 未显式限制时对 agentic 轮数的上限（等价于 `--max-turns`，后者优先级更高）                                                                 |
| `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`     |        `1500`        | SessionEnd hooks 的时间预算（毫秒），会自动提升到各 hook 配置 `timeout` 的最大值（上限 60 秒）                                            |
| `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`             |         `8`          | Stop/SubagentStop hook 连续阻止轮次结束的次数上限，超过则强制结束；`0`=禁用上限                                                           |
| `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`        | `600000`（10 分钟）  | 非交互模式（`-p`）最后一轮后等待后台 subagent/workflow 的最长时间，超时则终止；`0`=无限等待                                               |
| `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`           |        未设置        | 查询循环空闲后自动退出前的等待时间（毫秒），用于 SDK 自动化                                                                               |
| `MAX_STRUCTURED_OUTPUT_RETRIES`               |         `5`          | 非交互模式下响应未通过 `--json-schema` 校验时的重试次数                                                                                   |
| `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`         | `600000`（10 分钟）  | 后台 subagent 停滞超时；每个流式进度事件重置计时器，超时则中止并标记失败                                                                  |
| `CLAUDE_STREAM_IDLE_TIMEOUT_MS`               |        见意义        | 流式空闲看门狗关闭停滞连接的超时（毫秒），显式设置时最小 `300000`（5 分钟）                                                               |
| `CLAUDE_ENABLE_STREAM_WATCHDOG`               |        见意义        | `1` 强制启用 / `0` 强制禁用事件级流式空闲看门狗                                                                                           |
| `CLAUDE_ENABLE_BYTE_WATCHDOG`                 |        见意义        | `1` 强制启用 / `0` 强制禁用字节级流式空闲看门狗                                                                                           |
| `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`         |        未启用        | `1` 在 Bedrock `eventstream` 响应上启用字节级看门狗                                                                                       |
| `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS`           |        `5000`        | 刷新待处理 OTel span 的超时（毫秒）                                                                                                       |
| `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS`        |        `2000`        | 关闭时 OTel 导出器完成收尾的超时（毫秒）                                                                                                  |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS` | `1740000`（29 分钟） | 刷新动态 OTel 头的间隔（毫秒）                                                                                                            |
| `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`           |       `120000`       | 安装/更新插件时 git 操作的超时（毫秒）                                                                                                    |
| `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`            | `20`（WSL 为 `60`）  | Glob 工具文件发现的超时（秒）                                                                                                             |

## 输出 / Token / 上下文上限

| 变量                                      |          默认值          | 意义                                                                |
| :---------------------------------------- | :----------------------: | :------------------------------------------------------------------ |
| `BASH_MAX_OUTPUT_LENGTH`                  |          未明确          | bash 输出字符上限，超出后完整输出转存文件，Claude 仅收到路径与预览  |
| `TASK_MAX_OUTPUT_LENGTH`                  | `32000`（最大 `160000`） | subagent 输出截断前的字符上限，截断后完整输出转存磁盘并附路径       |
| `MAX_MCP_OUTPUT_TOKENS`                   |         `25000`          | MCP 工具响应允许的最大 token 数，超过 10000 会警告                  |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS`           |         模型相关         | 多数请求的最大输出 token 数（提升会压缩自动压缩前的有效上下文窗口） |
| `CLAUDE_CODE_MAX_CONTEXT_TOKENS`          |         模型相关         | 覆盖活动模型的上下文窗口大小，仅在同时设置 `DISABLE_COMPACT` 时生效 |
| `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` |         默认限制         | 覆盖文件读取的 token 上限，需要完整读大文件时用                     |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET`          |       上下文的 1%        | Skill 工具可见的 skill 元数据字符预算，回退值 8000                  |
| `CLAUDE_CODE_SCRIPT_CAPS`                 |          未设置          | 限制特定脚本每会话调用次数的 JSON（键为命令子串，值为整数上限）     |

## 上下文压缩 / Memory

| 变量                                           |     默认值     | 意义                                                                                    |
| :--------------------------------------------- | :------------: | :-------------------------------------------------------------------------------------- |
| `DISABLE_AUTO_COMPACT`                         |     未设置     | 设为 `1` 禁用接近上下文上限时的自动压缩（手动 `/compact` 仍可用）                       |
| `DISABLE_COMPACT`                              |     未设置     | 设为 `1` 禁用所有压缩（自动压缩 + 手动 `/compact`）                                     |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`              |     未设置     | 自动压缩触发阈值占窗口的百分比（1-100），调低（如 `50`）可提前压缩（只能调低）          |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW`              | 模型上下文窗口 | 自动压缩计算用的上下文容量（token），标准模型 200K、扩展上下文模型 1M                   |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY`              |     未设置     | 设为 `1` 禁用 auto memory；`0` 则强制开启（即使 `--bare` 或 `autoMemoryEnabled:false`） |
| `CLAUDE_CODE_DISABLE_CLAUDE_MDS`               |     未设置     | 设为 `1` 阻止任何 CLAUDE.md 记忆文件（用户/项目/auto-memory）载入上下文                 |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT`               |     未设置     | 设为 `1` 禁用 1M 上下文窗口支持，模型选择器中不再出现 1M 变体                           |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` |     未设置     | 设为 `1` 从 `--add-dir` 指定目录加载记忆文件（默认不加载）                              |

## Bash / Shell / 文件搜索

| 变量                                              | 默认值 | 意义                                                                                                                                                           |
| :------------------------------------------------ | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_SHELL`                               |  自动  | 覆盖 shell 自动检测（登录 shell 与偏好工作 shell 不一致时用）                                                                                                  |
| `CLAUDE_CODE_SHELL_PREFIX`                        | 未设置 | 包裹 Claude Code 启动的 shell 命令的前缀（Bash 工具、hook、status line、stdio MCP 启动命令），用于日志/审计                                                    |
| `CLAUDE_CODE_GIT_BASH_PATH`                       | 未设置 | Windows 专用：Git Bash 可执行文件（`bash.exe`）路径，已安装但不在 PATH 时用                                                                                    |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL`                 |  自动  | 控制 PowerShell 工具：Windows 无 Git Bash 时自动启用，`0` 禁用；Windows 有 Git Bash 时渐进推出，`1` 主动启用；Linux/macOS/WSL 设 `1` 启用（需 PATH 有 `pwsh`） |
| `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY` | 未设置 | 设为 `1` 不再传 `-ExecutionPolicy Bypass`，改遵从机器有效执行策略                                                                                              |
| `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`        | 未设置 | 主会话每条 Bash/PowerShell 命令执行后回到原始工作目录                                                                                                          |
| `CLAUDE_CODE_USE_NATIVE_FILE_SEARCH`              | 未设置 | 设为 `1` 用 Node.js 文件 API 而非 ripgrep 发现自定义命令/subagent/输出样式（bundled rg 不可用时用）                                                            |
| `USE_BUILTIN_RIPGREP`                             |  启用  | 设为 `0` 改用系统安装的 `rg` 而非 Claude Code 内置的 `rg`                                                                                                      |
| `CLAUDE_CODE_GLOB_HIDDEN`                         |  启用  | 设为 `false` 让 Glob 结果排除点文件                                                                                                                            |
| `CLAUDE_CODE_GLOB_NO_IGNORE`                      |  启用  | 设为 `false` 让 Glob 遵守 `.gitignore`（默认返回包括被忽略的所有匹配文件）                                                                                     |

## MCP

| 变量                                      |          默认值           | 意义                                                                             |
| :---------------------------------------- | :-----------------------: | :------------------------------------------------------------------------------- |
| `MCP_TIMEOUT`                             |     `30000`（30 秒）      | MCP 服务器启动超时（毫秒）                                                       |
| `MCP_TOOL_TIMEOUT`                        | `100000000`（约 28 小时） | MCP 工具执行超时（毫秒），`.mcp.json` 中 per-server `timeout` 可覆盖             |
| `MCP_CONNECT_TIMEOUT_MS`                  |          `5000`           | 阻塞式 MCP 启动等待连接批次的时间（毫秒）                                        |
| `MCP_CONNECTION_NONBLOCKING`              |           启用            | 控制启动是否等待 MCP 连接完成；设 `0` 恢复阻塞式 5 秒等待                        |
| `MCP_OAUTH_CALLBACK_PORT`                 |          未设置           | OAuth 回调的固定端口，作为 `--callback-port` 的替代                              |
| `MCP_SERVER_CONNECTION_BATCH_SIZE`        |            `3`            | 启动时并行连接的本地（stdio）MCP 服务器数上限                                    |
| `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE` |           `20`            | 启动时并行连接的远程（HTTP/SSE）MCP 服务器数上限                                 |
| `ENABLE_CLAUDEAI_MCP_SERVERS`             |     `true`（已登录）      | 设为 `false` 禁用 claude.ai MCP 服务器                                           |
| `CLAUDE_CODE_MCP_ALLOWLIST_ENV`           |          未设置           | 设为 `1` 仅以安全基线环境 + 服务器配置的 `env` 启动 stdio MCP，不继承 shell 环境 |
| `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`          |          未设置           | 设为 `1` 省略 SDK 创建的 MCP 服务器的 `mcp__<server>__` 工具名前缀（仅 SDK）     |

## 插件 / Skill / Workflow / Marketplace

| 变量                                                   |       默认值        | 意义                                                                                                 |
| :----------------------------------------------------- | :-----------------: | :--------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_PLUGIN_CACHE_DIR`                         | `~/.claude/plugins` | 覆盖插件根目录（实际是父目录，marketplace 与缓存位于其子目录）                                       |
| `CLAUDE_CODE_PLUGIN_SEED_DIR`                          |       未设置        | 一个或多个只读插件种子目录路径（Unix 用 `:`、Windows 用 `;` 分隔），用于容器镜像预置插件             |
| `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`                      |       未设置        | 设为 `1` 用 HTTPS 而非 SSH 克隆 GitHub `owner/repo` 简写源（CI/容器无 SSH key 时用）                 |
| `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`       |       未设置        | 设为 `1` 在 `git pull` 失败时保留现有 marketplace 缓存，而非擦除重克隆（离线/气隙环境用）            |
| `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL` |       未设置        | 设为 `1` 首次运行时跳过自动添加官方插件市场                                                          |
| `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS`                   |       未设置        | 设为 `1` 禁用 Claude Code 自带的 skills/workflows（插件与本地 skills 不受影响）                      |
| `CLAUDE_CODE_DISABLE_POLICY_SKILLS`                    |       未设置        | 设为 `1` 跳过从系统级托管 skills 目录加载                                                            |
| `CLAUDE_CODE_DISABLE_WORKFLOWS`                        |       未设置        | 设为 `1` 禁用 workflows                                                                              |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`                      |       未设置        | 非交互模式（`-p`）下设 `1` 等待插件安装完成再发首问                                                  |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`           |         无          | 同步插件安装的超时（毫秒），超时则无插件继续并记错；不设则等到完成                                   |
| `CLAUDE_CODE_SYNC_SKILLS`                              |       未设置        | 设 `1` 在首问前把启用的 claude.ai skills 下载到 `~/.claude/skills/` 并每 10 分钟同步（仅 `-p` 模式） |
| `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`           |       `30000`       | 会话中 skill 重同步的超时（毫秒）                                                                    |
| `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`              |       `5000`        | 首问等待初始 skill 同步的超时（毫秒）                                                                |
| `FORCE_AUTOUPDATE_PLUGINS`                             |       未设置        | 设 `1` 在主自动更新被 `DISABLE_AUTOUPDATER` 禁用时仍强制插件自动更新                                 |
| `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`              |       未设置        | 设 `1` 让新版本可用时 Claude Code 后台运行包管理器升级命令（Homebrew/WinGet）                        |

## 后台任务 / Agent / Subagent

| 变量                                      |               默认值                | 意义                                                                                            |
| :---------------------------------------- | :---------------------------------: | :---------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`    |               未启用                | 设 `1` 启用 agent teams（实验特性，默认禁用）                                                   |
| `CLAUDE_CODE_FORK_SUBAGENT`               |               未设置                | 设 `1` 允许 Claude 派生 fork subagent（继承完整对话上下文），`0` 禁用                           |
| `CLAUDE_CODE_ENABLE_TASKS`                |                启用                 | 控制会话用结构化 Task 工具还是旧版 `TodoWrite`；设 `0` 回退到 `TodoWrite`                       |
| `CLAUDE_CODE_TASK_LIST_ID`                |               未设置                | 跨会话共享任务列表，多实例设同一 ID 即可协同                                                    |
| `CLAUDE_CODE_TEAM_NAME`                   |                自动                 | 该队友所属的 agent team 名称（team 成员自动设置）                                               |
| `CLAUDE_AUTO_BACKGROUND_TASKS`            |               未设置                | 设 `1` 强制启用长任务自动后台化（约 2 分钟后转入后台）                                          |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`    |               未设置                | 设 `1` 禁用所有后台任务功能（含 `run_in_background`、自动后台化、Ctrl+B）                       |
| `CLAUDE_CODE_DISABLE_AGENT_VIEW`          |               未设置                | 设 `1` 关闭后台 agents 与 agent view（`claude agents`、`--bg`、`/background`、按需 supervisor） |
| `CLAUDE_CODE_DISABLE_ADVISOR_TOOL`        |               未设置                | 设 `1` 禁用 advisor 工具（`/advisor`、`--advisor` 失效，忽略 `advisorModel`）                   |
| `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`     |               未设置                | 设 `1` 上一会话在轮次中途结束时自动续接（SDK 模式用）                                           |
| `CLAUDE_CODE_RESUME_PROMPT`               | `Continue from where you left off.` | 覆盖续接中途结束会话时注入的续接消息                                                            |
| `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS` |               未设置                | 设 `1` 禁用所有内置 subagent 类型如 Explore/Plan（仅 `-p` 模式）                                |
| `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE`   |               未设置                | 设 `1` 强制保留 transcript/历史/`claude agents` 注册，即使从嵌套会话启动                        |

## IDE 集成

| 变量                                | 默认值 | 意义                                                                                                  |
| :---------------------------------- | :----: | :---------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_AUTO_CONNECT_IDE`      |  自动  | 覆盖自动 IDE 连接；`false` 阻止自动连接，`true` 在自动检测失败时强制尝试，优先级高于 `autoConnectIde` |
| `CLAUDE_CODE_IDE_HOST_OVERRIDE`     |  自动  | 覆盖连接 IDE 扩展用的主机地址                                                                         |
| `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL` | 未设置 | 跳过 IDE 扩展自动安装                                                                                 |
| `CLAUDE_CODE_IDE_SKIP_VALID_CHECK`  | 未设置 | 设 `1` 连接时跳过 IDE lockfile 条目校验（自动连接找不到正在运行的 IDE 时用）                          |
| `CLAUDE_CLIENT_PRESENCE_FILE`       | 未设置 | 外部工具（如屏幕锁监听）创建/删除的文件路径；文件存在时跳过 Remote Control 推送                       |
| `CLAUDE_CODE_CHILD_SESSION`         |  自动  | 由 Bash/PowerShell/Monitor 工具、hook、status line 子进程设为 `1`，用于区分嵌套会话                   |

## 遥测 / OTel / 错误上报 / 调查问卷

| 变量                                          | 默认值 | 意义                                                                                                                 |
| :-------------------------------------------- | :----: | :------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_ENABLE_TELEMETRY`                | 未启用 | 设 `1` 启用 OpenTelemetry 数据采集（配置 OTel 导出器前必须开启）                                                     |
| `DISABLE_TELEMETRY`                           | 未设置 | 设 `1` 退出遥测（不采集代码/路径/命令等用户数据），同时禁用 feature-flag 拉取                                        |
| `DO_NOT_TRACK`                                | 未设置 | 设 `1` 退出遥测，等价于 `DISABLE_TELEMETRY`（跨工具通用约定）                                                        |
| `DISABLE_ERROR_REPORTING`                     | 未设置 | 设 `1` 退出 Sentry 错误上报                                                                                          |
| `DISABLE_GROWTHBOOK`                          | 未设置 | 设 `1` 禁用 GrowthBook feature-flag 拉取，各 flag 用代码默认值                                                       |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`    | 未设置 | 设 `1` 等价于同时设置 `DISABLE_AUTOUPDATER`/`DISABLE_FEEDBACK_COMMAND`/`DISABLE_ERROR_REPORTING`/`DISABLE_TELEMETRY` |
| `DISABLE_AUTOUPDATER`                         | 未设置 | 设 `1` 禁用后台自动更新（手动 `claude update` 仍可用）                                                               |
| `DISABLE_UPDATES`                             | 未设置 | 设 `1` 阻止所有更新（含手动 `claude update`/`install`），比 `DISABLE_AUTOUPDATER` 更严格                             |
| `DISABLE_FEEDBACK_COMMAND`                    | 未设置 | 设 `1` 禁用 `/feedback` 命令（旧名 `DISABLE_BUG_COMMAND` 仍被接受）                                                  |
| `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`         | 未设置 | 设 `1` 禁用「How is Claude doing?」会话质量调查                                                                      |
| `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL` | 未设置 | 设 `1` 在屏蔽非必要流量时，把调查问卷路由到自己的 OTel collector（不发给 Anthropic）                                 |
| `CLAUDE_CODE_PROPAGATE_TRACEPARENT`           | 未设置 | 设 `1` 在走自定义代理时传播 W3C trace context（`traceparent` 头 + `TRACEPARENT` 环境变量）                           |
| `CLAUDE_CODE_OTEL_DIAG_STDERR`                | 未设置 | 设 `1` 把 OTel 导出器诊断错误写到 stderr（默认仅 `--debug` 可见）                                                    |
| `OTEL_LOG_RAW_API_BODIES`                     | 未启用 | 把 API 请求/响应 JSON 作为日志事件；`1`=截断到 60KB，`file:<dir>`=完整写盘                                           |
| `OTEL_LOG_TOOL_CONTENT`                       | 未启用 | 设 `1` 在 OTel span 事件中包含工具输入输出内容（默认关闭以保护敏感数据）                                             |
| `OTEL_LOG_TOOL_DETAILS`                       | 未启用 | 设 `1` 包含工具入参、MCP 服务器名、原始错误字符串等细节（默认关闭保护 PII）                                          |
| `OTEL_LOG_USER_PROMPTS`                       | 未启用 | 设 `1` 在 OTel 追踪/日志中包含用户提示文本（默认脱敏）                                                               |
| `OTEL_METRICS_INCLUDE_ACCOUNT_UUID`           |  启用  | 设 `false` 从 metrics 属性中排除账户 UUID                                                                            |
| `OTEL_METRICS_INCLUDE_ENTRYPOINT`             | 未启用 | 设 `true` 在 metrics 属性中包含会话入口                                                                              |
| `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES`    |  启用  | 设 `false` 排除 `OTEL_RESOURCE_ATTRIBUTES` 键                                                                        |
| `OTEL_METRICS_INCLUDE_SESSION_ID`             |  启用  | 设 `false` 从 metrics 属性中排除会话 ID                                                                              |
| `OTEL_METRICS_INCLUDE_VERSION`                | 未启用 | 设 `true` 在 metrics 属性中包含 Claude Code 版本                                                                     |

## Prompt 缓存

| 变量                               |  默认值  | 意义                                                                                                                 |
| :--------------------------------- | :------: | :------------------------------------------------------------------------------------------------------------------- |
| `DISABLE_PROMPT_CACHING`           |  未设置  | 设 `1` 对所有模型禁用 prompt 缓存（优先级高于 per-model 设置）                                                       |
| `DISABLE_PROMPT_CACHING_FABLE`     |  未设置  | 设 `1` 对 Fable 模型禁用 prompt 缓存                                                                                 |
| `DISABLE_PROMPT_CACHING_HAIKU`     |  未设置  | 设 `1` 对 Haiku 模型禁用 prompt 缓存                                                                                 |
| `DISABLE_PROMPT_CACHING_OPUS`      |  未设置  | 设 `1` 对 Opus 模型禁用 prompt 缓存                                                                                  |
| `DISABLE_PROMPT_CACHING_SONNET`    |  未设置  | 设 `1` 对 Sonnet 模型禁用 prompt 缓存                                                                                |
| `ENABLE_PROMPT_CACHING_1H`         |  未设置  | 设 `1` 请求 1 小时缓存 TTL（默认 5 分钟），1 小时写入计费更高                                                        |
| `ENABLE_PROMPT_CACHING_1H_BEDROCK` |  未设置  | [已弃用] 改用 `ENABLE_PROMPT_CACHING_1H`                                                                             |
| `FORCE_PROMPT_CACHING_5M`          |  未设置  | 设 `1` 强制 5 分钟缓存 TTL，覆盖 `ENABLE_PROMPT_CACHING_1H`                                                          |
| `CLAUDE_CODE_ATTRIBUTION_HEADER`   | 默认启用 | 设 `0` 移除系统提示开头的归属块（客户端版本 + 提示指纹）；经网关路由时可提升 cache 命中率，不影响 Anthropic API 缓存 |
| `ENABLE_TOOL_SEARCH`               |  见意义  | 控制 MCP 工具搜索；`true`=总是延迟并发 beta 头，`auto`/`auto:N`=阈值模式，`false`=全部前置加载                       |

## TUI / 显示 / 无障碍 / 光标

| 变量                                   | 默认值 | 意义                                                                   |
| :------------------------------------- | :----: | :--------------------------------------------------------------------- |
| `CLAUDE_CODE_NO_FLICKER`               | 未设置 | 设 `1` 启用全屏渲染（减少闪烁、长会话内存平稳），等价于 `tui` 设置     |
| `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`  | 未设置 | 设 `1` 全屏下每帧重绘整个屏幕（修复残影/错位文本）                     |
| `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN` | 未设置 | 设 `1` 禁用全屏渲染，改用经典主屏渲染器（对话留在终端原生 scrollback） |
| `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL`   | 未设置 | 设 `1` 禁用虚拟滚动，渲染 transcript 中每条消息（修复全屏滚动空白区）  |
| `CLAUDE_CODE_DISABLE_MOUSE`            | 未设置 | 设 `1` 禁用全屏下的鼠标追踪（保留 PgUp/PgDn 键盘滚动）                 |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`   | 未设置 | 设 `1` 禁用基于会话上下文的自动终端标题更新                            |
| `CLAUDE_CODE_NATIVE_CURSOR`            | 未设置 | 设 `1` 在输入光标处显示终端原生光标而非绘制的方块                      |
| `CLAUDE_CODE_SCROLL_SPEED`             | 见意义 | 全屏下鼠标滚轮滚动倍数（1-20，可小于 1 如 `0.5` 减速）                 |
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT`         |  启用  | 设 `false` 禁用 diff 输出中的语法高亮                                  |
| `CLAUDE_CODE_TMUX_TRUECOLOR`           | 未设置 | 设 `1` 在 tmux 内允许 24-bit 真彩色输出                                |
| `CLAUDE_CODE_FORCE_SYNC_OUTPUT`        | 未设置 | 设 `1` 强制启用 DEC mode 2026 同步输出（终端支持但未自动检测时用）     |
| `CLAUDE_CODE_ACCESSIBILITY`            | 未设置 | 设 `1` 保持原生终端光标可见并禁用反白光标指示（便于屏幕放大镜跟踪）    |
| `CLAUDE_AX_SCREEN_READER`              | 未设置 | 设 `1` 渲染屏幕阅读器友好输出（无装饰边框/动画的纯文本）               |
| `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`       |  启用  | 设 `0` 阻止新 artifact 发布时自动打开浏览器                            |
| `CLAUDE_CODE_DISABLE_ARTIFACT`         | 未设置 | 设 `1` 禁用 Artifact 工具（把会话输出发布为 claude.ai 私有网页）       |
| `CLAUDE_CODE_DISABLE_ATTACHMENTS`      | 未设置 | 设 `1` 禁用附件处理，`@` 文件提及作为纯文本发送                        |

## 自动模式 / 提示建议 / Away / 简化

| 变量                                           | 默认值 | 意义                                                                           |
| :--------------------------------------------- | :----: | :----------------------------------------------------------------------------- |
| `CLAUDE_CODE_ENABLE_AUTO_MODE`                 | 未设置 | 设 `1` 在 Bedrock/Vertex/Foundry 上启用 auto mode（Anthropic API 默认可用）    |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`         |  启用  | 设 `false` 禁用提示建议（Claude 回复后输入框中的灰色预测）                     |
| `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`              | 见意义 | 覆盖离开摘要可用性；`0` 强制关闭，`1` 在 `awaySummaryEnabled:false` 时强制开启 |
| `CLAUDE_CODE_NEW_INIT`                         | 未设置 | 设 `1` 让 `/init` 走交互式设置流程（先问要生成哪些文件再写）                   |
| `CLAUDE_CODE_SAFE_MODE`                        | 未设置 | 设 `1` 启动安全模式：不加载 CLAUDE.md/skills/plugins/hooks/MCP 等用于排障      |
| `CLAUDE_CODE_SIMPLE`                           | 未设置 | 设 `1` 以最简系统提示 + 仅 Bash/读/写工具运行（等价于 `--bare`）               |
| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`             | 未设置 | 设 `1` 对任意模型使用更短的系统提示与精简工具描述                              |
| `CLAUDE_CODE_HIDE_CWD`                         | 未设置 | 设 `1` 在启动 logo 中隐藏工作目录（录屏/直播时用）                             |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`         | 未设置 | 设 `1` 从系统提示中移除内置 commit/PR 流程说明与 git 快照                      |
| `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`       | 未设置 | 设 `1` 禁用文件检查点，`/rewind` 将无法恢复代码改动                            |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY`              | 未设置 | 设 `1` 不写 prompt 历史与 transcript 到磁盘（临时脚本会话用）                  |
| `CLAUDE_CODE_DISABLE_CRON`                     | 未设置 | 设 `1` 禁用定时任务（`/loop`、cron 工具失效，已排任务不再触发）                |
| `CLAUDE_CODE_ENABLE_BACKGROUND_PLUGIN_REFRESH` | 未设置 | 设 `1` 非交互模式后台安装完成后在轮次边界刷新插件状态                          |

## 会话 / 调试 / 配置目录

| 变量                                        |            默认值            | 意义                                                                                                 |
| :------------------------------------------ | :--------------------------: | :--------------------------------------------------------------------------------------------------- |
| `CLAUDE_CONFIG_DIR`                         |         `~/.claude`          | 覆盖配置目录，所有设置/凭据/历史/插件均存于此路径                                                    |
| `CLAUDE_CODE_TMPDIR`                        | `/tmp`（mac）/ `os.tmpdir()` | 覆盖内部临时文件目录                                                                                 |
| `CLAUDE_ENV_FILE`                           |            未设置            | Bash 命令前在同 shell 进程中执行的 shell 脚本路径（用于持久化 venv/conda 激活）                      |
| `CLAUDE_CODE_EXTRA_BODY`                    |            未设置            | 合并到每个 API 请求体顶层的 JSON 对象（传递 provider 专属参数）                                      |
| `CLAUDE_CODE_SESSION_ID`                    |             自动             | Bash/PowerShell/hook/stdio MCP 子进程中自动设为当前会话 ID                                           |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`          |            未设置            | 设 `1` 从子进程环境中剥离 Anthropic/云厂商凭据（降低 prompt 注入泄露风险）                           |
| `CLAUDE_CODE_DEBUG_LOGS_DIR`                |  `~/.claude/debug/<id>.txt`  | 覆盖调试日志文件路径（需另开 `--debug`/`DEBUG` 才生效）                                              |
| `CLAUDE_CODE_DEBUG_LOG_LEVEL`               |           `debug`            | 写入调试日志的最低级别：`verbose`/`debug`/`info`/`warn`/`error`                                      |
| `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX` |            主机名            | 未显式命名时自动生成的 Remote Control 会话名前缀                                                     |
| `CLAUDECODE`                                |             自动             | Claude Code 启动的子进程中设为 `1`，用于检测脚本是否运行在其子进程内                                 |
| `DEBUG`                                     |            未设置            | 设 `1`（或 `true`/`yes`/`on`）开启调试模式，等价于 `--debug`                                         |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`    |            未设置            | 设 `1` 从请求中剥离 Anthropic 专属 `anthropic-beta` 头与 beta 工具 schema 字段（代理拒绝 beta 时用） |

## 沙箱 / Perforce / 成本 / 杂项

| 变量                                             | 默认值 | 意义                                                                                        |
| :----------------------------------------------- | :----: | :------------------------------------------------------------------------------------------ |
| `CLAUDE_CODE_PERFORCE_MODE`                      | 未设置 | 设 `1` 启用 Perforce 感知写保护（目标文件缺 owner-write 位时 Edit/Write 报 `p4 edit` 提示） |
| `DISABLE_COST_WARNINGS`                          | 未设置 | 设 `1` 禁用成本警告消息                                                                     |
| `IS_DEMO`                                        | 未设置 | 设 `1` 启用 demo 模式：隐藏邮箱/组织名、跳过 onboarding                                     |
| `DISABLE_DOCTOR_COMMAND`                         | 未设置 | 设 `1` 隐藏 `/doctor` 命令                                                                  |
| `DISABLE_EXTRA_USAGE_COMMAND`                    | 未设置 | 设 `1` 隐藏 `/usage-credits` 命令                                                           |
| `DISABLE_INSTALLATION_CHECKS`                    | 未设置 | 设 `1` 禁用安装警告（仅手动管理安装位置时用）                                               |
| `DISABLE_INSTALL_GITHUB_APP_COMMAND`             | 未设置 | 设 `1` 隐藏 `/install-github-app` 命令                                                      |
| `DISABLE_LOGIN_COMMAND`                          | 未设置 | 设 `1` 隐藏 `/login` 命令                                                                   |
| `DISABLE_LOGOUT_COMMAND`                         | 未设置 | 设 `1` 隐藏 `/logout` 命令                                                                  |
| `DISABLE_UPGRADE_COMMAND`                        | 未设置 | 设 `1` 隐藏 `/upgrade` 命令                                                                 |
| `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING` | 见意义 | 控制工具调用输入是否边生成边流式；`0`=关闭，`1`=强制开启（代理路由时用）                    |
| `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`     | 未设置 | 设 `1` 从网关 `/v1/models` 端点填充 `/model` 选择器                                         |

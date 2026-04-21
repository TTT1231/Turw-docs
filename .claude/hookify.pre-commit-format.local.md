---
name: pre-commit-format
enabled: true
event: bash
pattern: git\s+commit
action: block
---

**代码提交前格式检查 Required**

在执行 `git commit` 之前，必须先运行代码格式化和拼写检查。

**执行步骤：**

1. 运行 `pnpm format` - 使用 Prettier 格式化代码
2. 运行 `pnpm check:cspell` - 检查拼写错误
3. 如果有格式问题或拼写错误 → **阻止提交**并修复
4. 如果全部通过 → 允许执行 `git commit`

**检查清单：**
- [ ] `pnpm format` 执行成功，无格式化问题
- [ ] `pnpm check:cspell` 执行成功，无拼写错误

**注意：** 如果 cspell 发现误报（正确的技术词汇被标记），应该添加到 `cspell.json` 的 `words` 数组中，而不是跳过检查。

---
name: pre-commit-checks
enabled: true
event: bash
action: block
pattern: git\s+commit
---

**提交前检查未通过！**

在执行 `git commit` 之前，必须按顺序完成以下步骤：

1. **格式化代码**: 运行 `bun run format`
2. **拼写检查**: 运行 `bun run check:cspell`，必须全部通过

请先执行：
```
bun run format && bun run check:cspell
```

只有 `check:cspell` 通过后才能执行 `git commit`。

# VSCode设置

## 配置文件配置

::: code-group

```json [settings.json]
{
   //[!code ++]
   // =============================== 编辑器爱好设置 ================================
   // 缩进与格式化
   "editor.tabSize": 3, // 制表符宽度为3空格（匹配 Prettier）
   "editor.detectIndentation": false, // 禁用自动检测缩进（强制使用tabSize）
   "editor.insertSpaces": true, // 使用空格而不是制表符
   "editor.renderWhitespace": "selection", // 只在选中时显示空白字符
   "editor.guides.indentation": true, // 显示缩进参考线
   "editor.defaultFormatter": "esbenp.prettier-vscode", // 默认使用Prettier格式化
   "editor.formatOnSave": true, // 保存时自动格式化
   "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit", // 保存时自动修复ESLint错误
      "source.fixAll.stylelint": "explicit", //保存时自动修复stylelint错误
      "source.organizeImports": "never" // 保存时不自动组织导入
   },
   // 光标与动画
   "editor.cursorBlinking": "expand", // 光标闪烁带扩展效果
   "editor.cursorSmoothCaretAnimation": "on", // 启用平滑光标移动动画
   "editor.largeFileOptimizations": true, // 优化大文件编辑性能
   //[!code ++]
   // =============================== 代码辅助功能 ================================
   // 智能建议
   "editor.inlineSuggest.enabled": true, // 启用内联代码建议（如Copilot）
   "editor.suggestSelection": "recentlyUsedByPrefix", // 根据前缀推荐最近使用的补全
   "editor.acceptSuggestionOnEnter": "smart", // 智能判断Enter键行为
   // 括号与符号处理
   "editor.bracketPairColorization.enabled": true, // 彩色括号配对
   "editor.autoClosingBrackets": "beforeWhitespace", // 智能括号闭合
   "editor.autoClosingOvertype": "always", // 自动覆盖闭合符号
   //[!code ++]
   // ========================== TypeScript专项优化 ===============================
   "typescript.inlayHints.enumMemberValues.enabled": true, // 显示枚举值提示
   "typescript.preferences.preferTypeOnlyAutoImports": true, // 优先使用import type
   "typescript.preferences.includePackageJsonAutoImports": "on", //允许从package.json的依赖中自动导入模块
   "typescript.preferences.importModuleSpecifier": "relative", // 使用相对路径导入
   "typescript.suggest.autoImports": true, // 启用自动导入建议
   "typescript.tsserver.exclude": ["**/node_modules", "**/dist", "**/.turbo"], //文件忽略
   //[!code ++]
   // ===== 语言特定格式化 =====
   "[html]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
   },
   "[css]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
   },
   "[scss]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
   },
   "[typescript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.formatOnSave": true
   },
   "[javascript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.formatOnSave": true
   },
   "[json]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
   },
   //[!code ++]
   // ===== 终端配置 =====
   "terminal.integrated.cursorBlinking": true, // 终端光标闪烁
   "terminal.integrated.tabs.enabled": true, // 启用终端标签页
   "terminal.integrated.scrollback": 10000, // 保留10000行历史记录
   //[!code ++]
   //======= 文件 =========
   "files.watcherExclude": {
      "**/.git/objects/**": true,
      "**/.git/subtree-cache/**": true,
      "**/.vscode/**": true,
      "**/node_modules/**": true,
      "**/tmp/**": true,
      "**/dist/**": true
   },
   //隐藏文件
   "files.exclude": {
      "**/.eslintcache": true,
      "**/.turbo": true,
      "**/.vitepress": true,
      "**/tmp": true,
      "**/.git": true,
      "**/.stylelintcache": true,
      "**/vite.config.mts.*": true
   },
   //文件搜索，排除以下文件
   "search.exclude": {
      "**/node_modules": true,
      "**/*.log": true,
      "**/*.log*": true,
      "**/dist": true,
      "**/.git": true,
      "**/.github": true,
      "**/.gitignore": true,
      "**/.vitepress/cache": true,
      "**/.idea": true,
      "**/.vscode": false,
      "**/tmp": true,
      "*.xml": true,
      "out": true,
      "dist": true,
      "node_modules": true,
      "**/pnpm-lock.yaml": true
   },
   //默认包管理工具
   "npm.packageManager": "pnpm",
   //[!code ++]
   //===== 折叠文件夹（美观优化） =====
   "explorer.fileNesting.enabled": true, // 启用文件嵌套功能
   "explorer.fileNesting.expand": false, // 默认折叠嵌套文件（不展开）
   "explorer.fileNesting.patterns": {
      //file fold
      "package.json": "pnpm-lock.yaml, .gitignore, .browserslistrc, .gitattributes, .gitconfig, .npmrc, cspell.json",
      "eslint.config.mjs": ".prettierignore, .prettierrc.json,.prettier,.editorconfig",
      "tsconfig.json": "tsconfig.*.json",
      "tailwind.config.js": "postcss.config.js",
      "vite.config.{js,ts}": "vite.*.{js,ts}",
      ".env": ".env.*",
      //nest folder
      "*.controller.ts": "$(capture).controller.spec.ts",
      "*.server.ts": "$(capture).server.spec.ts",

      //electron folder
      "vite.renderer.config.ts": "vite.*.config.ts",
      "forge.config.ts": "forge.env.d.ts"
   },
   //[!code ++]
   // =============================== 插件配置 ================================
   //Better Comments
   "better-comments.multilineComments": true,
   //vscode-icon
   "vsicons.associations.folders": [
      {
         "icon": "src",
         "extensions": ["renderer"],
         "format": "svg"
      }
   ],
   "vsicons.associations.files": [
      {
         "icon": "tsconfig",
         "extensions": ["tsconfig.preload.json"],
         "filename": true,
         "format": "svg"
      }
   ],
   "workbench.iconTheme": "vscode-icons",
   //version len
   "versionlens.suggestions.showOnStartup": true,
   //error lens
   "errorLens.enabledDiagnosticLevels": ["warning", "error"],
   //error len 主动排除eslint和cSpell错误，交给各自的插件进行
   "errorLens.excludeBySource": ["cSpell", "eslint"],

   //stylelint支持，关闭默认css、scss验证，使用stylelint验证与格式化
   "css.validate": false,
   "less.validate": false,
   "scss.validate": false,
   "stylelint.enable": true,
   "stylelint.packageManager": "pnpm",
   "stylelint.validate": ["css", "scss", "vue"],
   "stylelint.customSyntax": "postcss-html",
   "stylelint.snippet": ["css", "scss", "vue"],

   //vscode eslint
   "eslint.validate": [
      "javascript",
      "typescript",
      "javascriptreact",
      "typescriptreact",
      "vue",
      "html",
      "markdown",
      "json",
      "jsonc",
      "json5"
   ],

   //使用项目中的ts编译器进行ts检查，而不是vscode自带的
   "typescript.tsdk": "node_modules/typescript/lib",

   //cspell,这些默认合法
   "cSpell.words": ["archiver", "axios", "dotenv", "rollup", "vitest"]
}
```

```json [extensions.json]
{
   "recommendations": [
      // vue 支持
      "Vue.volar",
      //eslint 支持
      "dbaeumer.vscode-eslint",
      // prettier 支持
      "esbenp.prettier-vscode",
      //tailwindcss 提示
      "bradlc.vscode-tailwindcss",
      //scss 提示
      "mrmlnc.vscode-scss",
      //env 提示
      "mikestead.dotenv",
      //vscode-icons
      "vscode-icons-team.vscode-icons",
      //search node_modules
      "jasonnutter.search-node-modules",
      // Prisma support
      "prisma.prisma",
      //prettier ts error
      "yoavbls.pretty-ts-errors",
      //editorconfig
      "editorconfig.editorconfig",
      //color highlight
      "naumovs.color-highlight",
      //注释高亮
      "aaron-bond.better-comments",
      //自动闭合标签
      "formulahendry.auto-close-tag",
      //汉化
      "ms-ceintl.vscode-language-pack-zh-hans",
      // Git 相关插件
      "mhutchie.git-graph",
      // 自动重命名标签
      "formulahendry.auto-rename-tag",
      //package.json版本
      "pflannery.vscode-versionlens",
      //css搜索
      "pranaygp.vscode-css-peek",
      //version len
      "pflannery.vscode-versionlens",
      //stylelint
      "stylelint.vscode-stylelint",
      //error lens
      "usernamehw.errorlens",
      //code spell checker
      "streetsidesoftware.code-spell-checker"
   ]
}
```

```json [global.code-snippets]
{
   //[!code ++]
   //============================== vue快捷指令 ==============================//
   "vue-script-setup": {
      "scope": "vue",
      "prefix": "!vue",
      "body": [
         "<script setup lang=\"ts\">",
         "const props = defineProps<{",
         "  modelValue?: boolean,",
         "}>()",
         "$1",
         "</script>",
         "",
         "<template>",
         "  <div>",
         "    <slot/>",
         "  </div>",
         "</template>"
      ]
   },
   "import": {
      "scope": "javascript,typescript",
      "prefix": "im",
      "body": ["import { $2 } from '$1';"],
      "description": "Import a module"
   },
   "export-all": {
      "scope": "javascript,typescript",
      "prefix": "ex",
      "body": ["export * from '$1';"],
      "description": "Export a module"
   },
   //[!code ++]
   //=========================== 文档快捷键命令相关 ==========================//
   "code-group": {
      "scope": "markdown",
      "prefix": [":::code-group"],
      "body": ["::: code-group", "$1", ":::"],
      "description": "代码组"
   },
   "code++": {
      "scope": "typescript",
      "prefix": ["!code++"],
      "body": ["[!code ++]"],
      "description": "代码块++"
   },
   "code--": {
      "scope": "typescript",
      "prefix": ["!code--"],
      "body": ["[!code --]"],
      "description": "代码块--"
   },
   "code-warning": {
      "scope": "typescript",
      "prefix": ["!codewarning"],
      "body": ["[!code warning]"],
      "description": "代码块警告"
   },
   "code-error": {
      "scope": "typescript",
      "prefix": ["!codeerror"],
      "body": ["[!code error]"],
      "description": "代码块错误"
   },
   "details-vitepress": {
      "scope": "markdown",
      "prefix": [":::details"],
      "body": ["::: details", "$1", ":::"],
      "description": "通知"
   },
   "info-vitepress": {
      "scope": "markdown",
      "prefix": [":::info"],
      "body": ["::: info 通知", "$1", ":::"],
      "description": "通知"
   },
   "tip-vitepress": {
      "scope": "markdown",
      "prefix": [":::tip"],
      "body": ["::: tip 提示", "$1", ":::"],
      "description": "提示"
   },
   "warning-vitepress": {
      "scope": "markdown",
      "prefix": [":::warning"],
      "body": ["::: warning 注意", "$1", ":::"],
      "description": "注意"
   },
   "danger-vitepress": {
      "scope": "markdown",
      "prefix": [":::danger"],
      "body": ["::: danger 危险", "$1", ":::"],
      "description": "危险"
   },
   "NOTE-Github": {
      "scope": "markdown",
      "prefix": ["!NOTE"],
      "body": ["> [!NOTE]", "$1", ">"],
      "description": "笔记"
   },
   "TIP-Github": {
      "scope": "markdown",
      "prefix": ["!TIP"],
      "body": ["> [!TIP] 提示", "$1", ">"],
      "description": "提示"
   },
   "IMPORTANT-Github": {
      "scope": "markdown",
      "prefix": ["!IMPORTANT"],
      "body": ["> [!IMPORTANT] 重要", "$1", ">"],
      "description": "重要"
   },
   "WARNING-Github": {
      "scope": "markdown",
      "prefix": ["!WARNING"],
      "body": ["> [!WARNING] 注意", "$1", ">"],
      "description": "注意"
   },
   "CAUTION-Github": {
      "scope": "markdown",
      "prefix": ["!CAUTION"],
      "body": ["> [!CAUTION] 小心", "$1", ">"],
      "description": "小心"
   },
   //[!code ++]
   //=========================== 拼写检查快捷命令 ==========================//
   "cspell:disable": {
      "scope": "vue,typescript,javascript",
      "prefix": ["cspell:disable"],
      "body": ["//cspell:disable"],
      "description": "禁用后面所有的拼写检查"
   },
   "cspell:enable": {
      "scope": "vue,typescript,javascript",
      "prefix": ["cspell:enable"],
      "body": ["//cspell:enable"],
      "description": "启用后面所有的拼写检查"
   },
   "spell-checker:disable": {
      "scope": "vue,typescript,javascript",
      "prefix": ["spell-checker:disable"],
      "body": ["//spell-checker:disable"],
      "description": "禁用拼写检查开始符"
   },
   "spell-checker:enable": {
      "scope": "vue,typescript,javascript",
      "prefix": ["spell-checker:enable"],
      "body": ["//spell-checker:enable"],
      "description": "禁用拼写检查结束符"
   },
   "cspell:disable-next-line": {
      "scope": "vue,typescript,javascript",
      "prefix": ["cspell:disable-next-line"],
      "body": ["//cspell:disable-next-line"],
      "description": "禁用下一行的拼写检查"
   }
}
```

:::

## 插件注意

::: warning 注意
由于这里使用的是`vscode-icons`插件，因此所支持的图标如下:

- [文件夹图标](https://github.com/vscode-icons/vscode-icons/wiki/ListOfFolders)
- [文件图标](https://github.com/vscode-icons/vscode-icons/wiki/ListOfFiles)

没有的话，就只能按照文档自己配置自定义的文件夹图标和文件图标
:::

## 工作区设置

主要用于单项目多文件夹下视觉疲劳问题，借助`vscode 工作区设置解决`。

::: code-group

```jsonc [customer.code-workspace]
{
   //自定义显示文件夹
   "folders": [
      {
         "name": "renderer",
         "path": "src/renderer"
      }
      //....
   ],

   //同.vscode/settings.json设置一样设置工作区，会覆盖全局设置
   "settings": {
      //不显示某些文件
      "files.exclude": {
         // 隐藏 src/preload 中的特定文件
         "src/preload/ipcUtil.ts": true,
         // 隐藏文件夹
         "src/main/ipc/utils": true
         //...
      },
      // 工作区用不同的字体大小
      "editor.fontSize": 18
      //其他设置
      //.....
   }
}
```

:::

## 跨编译器风格统一

::: code-group

```json[.editorconfig]
root = true

[*]
charset=utf-8
end_of_line=lf
insert_final_newline=true
indent_style=space
indent_size=3
max_line_length = 100
trim_trailing_whitespace = true
quote_type = single

[*.{yml,yaml,json}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

```

:::

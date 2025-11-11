# 代码格式化与检查

| 插件/包名称                        | 作用      | 说明                                       |
| ---------------------------------- | --------- | ------------------------------------------ |
| `eslint-config-prettier`           | 禁用冲突  | 确保 ESLint 不干扰 Prettier                |
| `eslint-plugin-prettier`           | 格式检查  | 检查代码是否符合 Prettier 格式要求         |
| `@typescript-eslint/eslint-plugin` | TS 规则   | 处理类型注解、接口、泛型等 TypeScript 语法 |
| `@typescript-eslint/parser`        | TS 解析器 | 让 ESLint 能解析 TypeScript 代码           |

::: warning
@typescript-eslint/parser 必须与 @typescript-eslint/eslint-plugin 配合使用。前者负责解析 TypeScript 代码，后者负责执行具体的 linting 规则。
:::

## 安装

```cmd
pnpm add -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier

```

## 配置eslint和prettier

::: code-group

```ts [eslint.config.mjs]
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
   {
      files: ['**/*.{js,ts,mjs}'],
      ignores: ['eslint.config.mjs'], // 排除配置文件，根据实际情况进行添加 //[!code warning]
      languageOptions: {
         parser: tsParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json'
         }
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin
      },
      rules: {
         // 基础规则（自定义规则）
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         '@typescript-eslint/no-explicit-any': 'warn',

         // Import/Export 类型规则
         '@typescript-eslint/consistent-type-imports': [
            'error',
            {
               prefer: 'type-imports',
               disallowTypeAnnotations: false
            }
         ],
         '@typescript-eslint/consistent-type-exports': [
            'error',
            {
               fixMixedExportsWithInlineTypeSpecifier: true
            }
         ],

         // Prettier 集成
         'prettier/prettier': 'error' //prettier错误也提示，避免因为风格问题导致的代码提交[!code warning]
      }
   },
   prettierConfig, // 禁用与 Prettier 冲突的规则，必须放在最后[!code warning]
   {
      ignores: ['node_modules/**', 'dist/**', 'esbuild.config.mjs'] //全局配置，对整个项目生效[!code warning]
   }
];
```

```json [.prettierrc.json]
{
   "semi": true,
   "trailingComma": "all",
   "singleQuote": true,
   "printWidth": 100,
   "tabWidth": 3,
   "useTabs": false,
   "quoteProps": "as-needed",
   "jsxSingleQuote": true,
   "bracketSpacing": true,
   "bracketSameLine": false,
   "arrowParens": "avoid",
   "endOfLine": "lf",
   "proseWrap": "preserve",
   "htmlWhitespaceSensitivity": "css",
   "embeddedLanguageFormatting": "auto"
}
```

```[.prettierignore]
# Dependencies
node_modules/
pnpm-lock.yaml
package-lock.json
yarn.lock

# Build outputs
dist/
build/
*.tsbuildinfo

# Logs
*.log
logs/

# Environment files
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Coverage
coverage/

# Static assets (optional, remove if you want to format them)
*.svg
*.png
*.jpg
*.jpeg
*.gif
*.ico
*.woff
*.woff2
*.ttf
*.eot

# custom settings
pnpm-workspace.yaml
```

:::

## 配置命令

**然后设置package.json命令**

::: info 注
server这里是示例名，类似项目src可以自定义
:::

| 脚本命令                                                           | 描述                             |
| ------------------------------------------------------------------ | -------------------------------- |
| "lint": "eslint .",                                                | **eslint检查**                   |
| "lint:fix": "eslint \"src/\*_/_.{js,ts}\" --fix",                  | **eslint修复** ts、js            |
| "format": "prettier --write \"server/\*_/_.{ts,js,json}\"",        | **prettier格式化** ts,js,json    |
| `"format:check": "prettier --check \"server/**/*.{ts,js,json}\""`, | **prettier检查** ts,js,json      |
| "code:check": "pnpm run lint && pnpm run format:check",            | 先执行lint检查，再检查格式化问题 |
| "code:fix": "pnpm run lint:fix && pnpm run format"                 | 自动修复lint问题并格式化代码     |

> [!IMPORTANT] 文件保存时自动执行(.vscode/settings.json)
>
> ```json
> {
>    "editor.formatOnSave": true, // 保存时自动格式化 [!code ++]
>    //[!code ++]
>    "editor.codeActionsOnSave": {
>       "source.fixAll.eslint": "explicit" // 保存时自动修复ESLint错误 [!code ++]
>       //[!code ++]
>    }
> }
> ```

>

# 代码格式化与检查

- **eslint-config-prettier** 禁用Eslint与Prettier冲突规则，确保Eslint不会干扰Prettier
- **exlint-plugin-prettier** 检查代码是否符合Prettier的格式要求
- **@typescript-eslint/eslint-plugin** 处理ts中类型注解、接口、泛型等等
- **@typescript-eslint/parser** Eslint解析器，解析ts代码

<span class="text-red-400">注：@typescript-eslint/parser 必须与 @typescript-eslint/eslint-plugin 配合使用。前者负责解析 TypeScript 代码，后者负责执行具体的 linting 规则。</span>
  
## 安装

```cmd
pnpm add -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier                     

```

## 配置eslint

创建**eslint.config.mjs**配置文件

```ts
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
   {
      files: ['**/*.{js,ts,mjs}'],
      ignores: ['eslint.config.mjs'], // 排除配置文件
      languageOptions: {
         parser: tsParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json',
         },
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin,
      },
      rules: {
         // 基础规则（自定义规则）
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_' },
         ],
         '@typescript-eslint/no-explicit-any': 'warn',

         // Import/Export 类型规则
         '@typescript-eslint/consistent-type-imports': [
            'error',
            {
               prefer: 'type-imports',
               disallowTypeAnnotations: false,
            },
         ],
         '@typescript-eslint/consistent-type-exports': [
            'error',
            {
               fixMixedExportsWithInlineTypeSpecifier: true,
            },
         ],

         // Prettier 集成
         'prettier/prettier': 'error',
      },
   },
   prettierConfig, // 禁用与 Prettier 冲突的规则，必须放在最后
   {
      ignores: ['node_modules/**', 'dist/**', 'esbuild.config.mjs'],
   },
];

```

## 配置prettier

**创建.prettierrc.json和.prettierignore**

`.prettier.json`
```json
{
   "semi": true,
   "trailingComma": "es5",
   "singleQuote": true,
   "printWidth": 80,
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

`.prettierignore`

```
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

```

## 配置命令

**然后设置package.json命令**
<span class=" text-red-400"> 注：server这里是示例名，类似项目src可以自定义</span>

| 脚本命令                          | 描述 |
|----------------------------------|------|
| "lint": "eslint .",            | **eslint检查** |
| "lint:fix": "eslint \"server/**/*.{ts,js}\" --fix", |**eslint修复** ts、js |
| `"format": "prettier --write \"server/**/*.{ts,js,json}\""`, | **prettier格式化** ts,js,json|
| `"format:check": "prettier --check \"server/**/*.{ts,js,json}\""`, | **prettier检查** ts,js,json  |
| `"code:check": "pnpm run lint && pnpm run format:check",**` | 先执行lint检查，再检查格式化问题 |
| `"code:fix": "pnpm run lint:fix && pnpm run format"**` | 自动修复lint问题并格式化代码 |

<span class=" text-green-600"> 也可以使用vscode设置，自动执行【选项】(.vscode/settings.json)</span>

```json
{
   //your before settings

  "editor.formatOnSave": true,               // 保存时自动格式化
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"       // 保存时自动修复ESLint错误
  },
}
```
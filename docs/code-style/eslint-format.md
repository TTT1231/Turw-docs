# 代码格式化与检查

| 插件/包名称                        | 作用      | 说明                                       |
| ---------------------------------- | --------- | ------------------------------------------ |
| `eslint-config-prettier`           | 禁用冲突  | 确保 ESLint 不干扰 Prettier                |
| `eslint-plugin-prettier`           | 格式检查  | 检查代码是否符合 Prettier 格式要求         |
| `@typescript-eslint/eslint-plugin` | TS 规则   | 处理类型注解、接口、泛型等 TypeScript 语法 |
| `@typescript-eslint/parser`        | TS 解析器 | 让 ESLint 能解析 TypeScript 代码           |

::: warning 注意
@typescript-eslint/parser 必须与 @typescript-eslint/eslint-plugin 配合使用。前者负责解析 TypeScript 代码，后者负责执行具体的 linting 规则。
:::

## 安装

```sh:no-line-numbers
pnpm add -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier

```

## 配置eslint和prettier

::: code-group-fold line-numbers

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

::: warning 注意
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

## 配置 Stylelint

**安装**：

```sh:no-line-numbers
pnpm add @stylistic/stylelint-plugin postcss-scss stylelint-config-recommended-vue stylelint-config-standard-scss stylelint-prettier stylelint-scss vue -D @types/node @typescript-eslint/eslint-plugin @typescript-eslint/parser @vitejs/plugin-vue @vue/tsconfig eslint eslint-config-prettier eslint-plugin-prettier postcss-html prettier sass stylelint stylelint-config-recommended-scss stylelint-config-standard stylelint-order typescript vite vue-tsc
```

::: code-group-fold line-numbers

```ts [stylelint.config.mjs]
/** @type {import("stylelint").Config} */
export default {
   extends: ['stylelint-config-standard'],
   ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.json', '**/*.md'],
   reportDescriptionlessDisables: true, //禁用规则必须有描述
   reportInvalidScopeDisables: true, //禁用规则必须在有效范围内
   reportNeedlessDisables: true, //报告不必要的禁用
   //vue和scss配置
   overrides: [
      {
         customSyntax: 'postcss-html',
         files: ['*.(html|vue)', '**/*.(html|vue)'],
         rules: {
            //禁止使用未知的伪类选择器
            'selector-pseudo-class-no-unknown': [
               true,
               {
                  ignorePseudoClasses: ['global', 'deep']
               }
            ],
            //禁止使用未知的伪元素选择器
            'selector-pseudo-element-no-unknown': [
               true,
               {
                  ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted']
               }
            ]
         }
      },
      {
         customSyntax: 'postcss-scss',
         extends: ['stylelint-config-recommended-scss', 'stylelint-config-recommended-vue/scss'],
         files: ['*.scss', '**/*.scss']
      }
   ],
   plugins: [
      //css排序
      'stylelint-order',
      //scss预处理器支持
      'stylelint-scss',
      //css风格校验
      '@stylistic/stylelint-plugin',
      //css与prettier集成
      'stylelint-prettier'
   ],
   rules: {
      'at-rule-no-deprecated': null, //禁止使用过时的css@规则
      'at-rule-no-unknown': [
         true,
         {
            ignoreAtRules: [
               'extends',
               'ignores',
               'include',
               'mixin',
               'if',
               'else',
               'media',
               'for',
               'at-root',
               'tailwind',
               'apply',
               'variants',
               'responsive',
               'screen',
               'function',
               'each',
               'use',
               'forward',
               'return'
            ] //禁止使用未知的@规则，同时配置scss语法@规则支持
         }
      ],
      'font-family-no-missing-generic-family-keyword': null, //强制要求font-family的属性必须包含通用字体族
      'function-no-unknown': null, //禁止使用未知的函数
      'import-notation': 'string', //强制使用字符串引入
      'media-feature-range-notation': null, //规范媒体特性范围的表示法
      'named-grid-areas-no-invalid': null, //检查命名网格区域是否无效
      'no-descending-specificity': null, //禁止低优先级覆盖高优先级
      'no-empty-source': null, //禁止空的样式,例如空文件等
      //stylelint-order插件，强制按照特定顺序书写css属性
      'order/order': [
         [
            'dollar-variables', //scss变量
            'custom-properties', //css属性
            'at-rules', //@规则,例如@import等//!这里属于大规则，如果与小规则冲突，会被小规则覆盖
            'declarations', //css
            {
               //supports规则
               name: 'supports',
               type: 'at-rule'
            },
            {
               //media规则
               name: 'media',
               type: 'at-rule'
            },
            {
               //import规则，小分类覆盖大分类中import规则
               name: 'import',
               type: 'at-rule'
            },
            'rules' //嵌套规则，例如 &__icon、&:hover、.u-btn--primary等
         ],
         { severity: 'warning' } //违反规则为警告级别
      ],
      'prettier/prettier': true, //stylelint复用prettier规则
      //声明块前必须加一个空行
      'rule-empty-line-before': [
         'always',
         {
            ignore: ['after-comment', 'first-nested'] //忽略注释后和第一个嵌套规则前
         }
      ],
      //stylelint-scss插件，验证scss中@开头的语句是否合法
      'scss/at-rule-no-unknown': [
         true,
         {
            ignoreAtRules: [
               'extends',
               'ignores',
               'include',
               'mixin',
               'if',
               'else',
               'media',
               'for',
               'at-root',
               'tailwind',
               'apply',
               'variants',
               'responsive',
               'screen',
               'function',
               'each',
               'use',
               'forward',
               'return'
            ] //忽略scss语法@规则
         }
      ],
      /**
       * BEM 变体类名规范
       * [可选前缀] - 块名 __ [元素名] -- [修饰符]
       * !元素用__连接，修饰符用--连接(这里修饰符大多指状态，例如active、disabled等)
       * - 块名--修饰符
       * - 块名__元素名--修饰符
       * - 块名__元素名
       * !常用前缀(c-,u-,js-) 表示组件(有业务语义，一般都是特定组件可用)、工具(无业务语义可复用)、js(js专用)
       * @usage @example
       * .c-btn--primary {}   //按钮组件primary
       * .c-card__header {}   //卡片组件的header元素
       * .u-hidden {}         //通用隐藏类
       * .is-active {}        //状态类
       * .u-mt-15 {}          //工具类，表示margin-top:15px
       * .js-modal {}         //js操作，表示某个modal组件样式
       * .js-modal--active {} //js操作，表示某个modal组件的active状态样式
       */
      'selector-class-pattern':
         '^(?:(?:o|c|u|t|s|is|has|_|js|qa)-)?[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:__[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:--[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)?(?:[.+])?$',

      'selector-not-notation': 'complex', //规范:not()为现代表示法
      'scss/operator-no-newline-before': null //scss操作符可以换行
   }
};
```

```[.stylelintignore]
dist
public
__tests__
coverage
```

:::

## 配置Cspell

**安装：**

```sh:no-line-numbers
pnpm add cspell -D
```

::: code-group-fold line-numbers

```json [cspell.json]
{
   "$schema": "https://raw.githubusercontent.com/streetsidesoftware/cspell/main/cspell.schema.json",
   "version": "0.2",
   "language": "en,en-US",
   // 复合词检查
   "allowCompoundWords": true,
   // 正确单词列表
   "words": [
      "defu",
      "echarts",
      "iconify",
      "minh",
      "minw",
      "mockjs",
      "nprogress",
      "nuxt",
      "pinia",
      "prefixs",
      "qrcode",
      "vite",
      "vitejs",
      "vitepress",
      "vueuse"
   ],
   // 从cspell的配置文件为当前目录，file patterns为匹配
   "ignorePaths": [
      "**/node_modules/**",
      "**/dist/**",
      "**/*-dist/**",
      "**/icons/**",
      "pnpm-lock.yaml",
      "**/*.log",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/__tests__/**",
      "**/*.svg",
      "**/*.png",
      "**/*.ico",
      "docs/.vitepress/cache/**"
   ]
}
```

:::

## 检查命令

::: code-group

```sh:no-line-numbers [install.sh]
npm install -g cspell
```

:::

| 说明                 | 命令                                                                       |
| :------------------- | :------------------------------------------------------------------------- |
| 检查所有文件         | **cspell \"\*\*\"**                                                        |
| 检查未暂存文件       | **git diff --name-only \| cspell --file-list stdin**                       |
| 检查已暂存文件       | **git diff --cached --name-only \| cspell --file-list stdin**              |
| 查看上一次已提交文件 | **git diff HEAD^ HEAD --name-only \| cspell --file-list stdin**            |
| 检查指定文件         | :heavy_exclamation_mark:`cspell check <filename>` :heavy_exclamation_mark: |

::: warning 注意

在vscode中，`检查指定文件`,**不推荐**，直接使用vscode插件**Code Spell Checker**即可

:::

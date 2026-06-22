import type MarkdownIt from 'markdown-it';
import { defineConfig } from 'vitepress';

interface FoldCodeEntry {
   lang: string;
   title: string;
   code: string;
}

const CODE_GROUP_FOLD_OPEN_RE = /^:::\s*(?:code-group-fold|code-block)(?:\s+(.*))?$/;
const FENCE_RE = /^```([^\n]*)\n([\s\S]*?)^```\s*$/gm;

function escapeHtml(value: string): string {
   return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}

function parseFenceInfo(info: string, index: number) {
   const normalized = info.trim();
   const titleMatch = normalized.match(/\[([^\]]+)\]/);
   const lang = normalized.split(/\s|\[/)[0] || 'ts';
   const title = titleMatch?.[1] || lang.toUpperCase() || `Code ${index + 1}`;

   return { lang, title };
}

function parseFoldCodeEntries(content: string, fallbackLang: string): FoldCodeEntry[] {
   const entries: FoldCodeEntry[] = [];

   for (const match of content.matchAll(FENCE_RE)) {
      const { lang, title } = parseFenceInfo(match[1] || fallbackLang, entries.length);
      entries.push({
         lang,
         title,
         code: match[2].replace(/\n$/, '')
      });
   }

   if (!entries.length && content.trim()) {
      entries.push({
         lang: fallbackLang || 'ts',
         title: (fallbackLang || 'ts').toUpperCase(),
         code: content
      });
   }

   return entries;
}

function foldCodeBlockPlugin(md: MarkdownIt) {
   const renderFoldCodeGroup = (entries: FoldCodeEntry[], options: string) => {
      const encodedBlocks = encodeURIComponent(JSON.stringify(entries));
      const lineNumbers = /\bline-numbers\b/.test(options) ? ' line-numbers' : '';

      return `<FoldCodeGroup encoded-blocks="${escapeHtml(encodedBlocks)}"${lineNumbers} />\n`;
   };

   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- markdown-it block ruler state
   const rule = (state: any, startLine: number, endLine: number, silent: boolean) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const marker = state.src.slice(start, max).trim();
      const openMatch = marker.match(CODE_GROUP_FOLD_OPEN_RE);

      if (!openMatch) return false;
      if (silent) return true;

      let nextLine = startLine + 1;
      for (; nextLine < endLine; nextLine++) {
         const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
         const lineMax = state.eMarks[nextLine];
         if (state.src.slice(lineStart, lineMax).trim() === ':::') break;
      }

      if (nextLine >= endLine) return false;

      const options = openMatch[1] || '';
      const fallbackLang =
         options.split(/\s+/).find((item: string) => item && item !== 'line-numbers') || 'ts';
      const content = state.getLines(startLine + 1, nextLine, state.blkIndent, false);
      const entries = parseFoldCodeEntries(content, fallbackLang);

      const token = state.push('html_block', '', 0);
      token.content = renderFoldCodeGroup(entries, options);
      token.map = [startLine, nextLine + 1];
      state.line = nextLine + 1;

      return true;
   };

   try {
      md.block.ruler.before('container', 'fold_code_group', rule, {
         alt: ['paragraph', 'reference', 'blockquote', 'list']
      });
   } catch {
      md.block.ruler.before('fence', 'fold_code_group', rule, {
         alt: ['paragraph', 'reference', 'blockquote', 'list']
      });
   }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
   vite: {
      css: {
         preprocessorOptions: {
            scss: {
               api: 'modern-compiler' // 使用现代 Sass API
            }
         }
      }
   },
   markdown: {
      lineNumbers: true, // 启用代码块行号
      config(md) {
         md.use(foldCodeBlockPlugin);
      }
   },
   lang: 'zh-CN',
   base: '/Turw-docs/', // Set to your desired base path
   title: '我的文档',
   description: '日常学习',
   lastUpdated: true,
   head: [['link', { rel: 'icon', href: '/Turw-docs/assets/favicon.ico' }]],
   themeConfig: {
      logo: '/assets/logo.svg',
      nav: [
         { text: '主页', link: '/' },
         {
            text: '快速访问',
            items: [
               { text: '前端FAQ', link: '/frontdesign/faq' },
               { text: 'NuxtFAQ', link: '/nuxt/config-solutions' },
               { text: 'Electron', link: '/frontdesign/electron' },
               { text: 'Node', link: '/server/Nodejs' },
               { text: 'Nest', link: '/server/Nestjs' },
               { text: 'harness', link: '/harness' },
               { text: 'claude', link: '/claude-use' }
            ]
         }
      ],
      lastUpdated: {
         text: '最后更新于'
      },
      editLink: {
         pattern: 'https://github.com/TTT1231/Turw-docs/edit/main/docs/:path',
         text: '在 GitHub 上编辑此页面'
      },
      search: { provider: 'local' },

      sidebar: [
         {
            text: '前端',
            collapsed: true,
            items: [
               {
                  text: 'CSS',
                  link: '/frontdesign/css-layout'
               },
               {
                  text: 'ES6+',
                  link: '/frontdesign/ES6'
               },
               {
                  text: 'Vite⚡',
                  link: '/frontdesign/Vite'
               },
               {
                  text: 'Monorepo管理',
                  link: '/frontdesign/monorepo-management'
               },
               {
                  text: '移动端',
                  link: '/frontdesign/mobile'
               },
               {
                  text: '前端安全',
                  link: '/frontdesign/front-security'
               },
               {
                  text: 'electron',
                  collapsed: true,
                  link: '/frontdesign/electron'
               },
               {
                  text: 'uniapp',
                  collapsed: true,
                  link: '/frontdesign/uniapp'
               },
               {
                  text: 'WebAssembly',
                  collapsed: true,
                  link: '/frontdesign/WebAssembly'
               },
               {
                  text: 'VUE3',
                  collapsed: true,
                  items: [
                     { text: 'vue-router', link: '/frontdesign/vue3/vue-router' },
                     { text: '开发环境问题', link: '/frontdesign/vue3/vue-problem' },
                     { text: '性能优化', link: '/frontdesign/vue3/performance-optimize' },
                     { text: 'vue核心', link: '/frontdesign/vue3/vue-core' }
                  ]
               },
               {
                  text: 'FAQ',
                  link: '/frontdesign/faq'
               }
            ]
         },
         {
            text: 'Nuxt全栈',
            collapsed: true,
            items: [
               { text: '目录结构', link: '/nuxt/catalog' },
               { text: '统一错误处理架构', link: '/nuxt/error-handle' },
               { text: 'SEO-SSR', link: '/nuxt/seo-ssr' },
               { text: 'FAQ', link: '/nuxt/config-solutions' }
            ]
         },
         {
            text: '代码风格和规范',
            collapsed: true,
            items: [
               { text: '格式化代码与检查', link: '/code-style/eslint-format' },
               { text: 'vscode编译器设置', link: '/code-style/vscode-setting' },
               {
                  text: 'WSL2代理',
                  collapsed: true,
                  link: '/wsl/wsl'
               }
            ]
         },
         {
            text: 'SQL',
            collapsed: true,
            items: [
               { text: 'prisma', link: '/sql/sql-prisma' },
               { text: 'SQL优化', link: '/sql/sql-optimize' }
            ]
         },

         {
            text: '服务端',
            collapsed: true,
            items: [
               { text: '架构设计思想', link: '/server/architect-design-thought' },
               {
                  text: 'Nodejs',
                  link: '/server/Nodejs'
               },
               {
                  text: 'Nestjs',
                  link: '/server/Nestjs'
               },
               {
                  text: 'GraphQL',
                  link: '/server/graphql'
               }
            ]
         },
         {
            text: 'harness',
            collapsed: true,
            link: '/harness'
         },
         {
            text: 'claude使用',
            collapsed: true,
            items: [
               { text: 'claude', link: '/claude-use' },
               {
                  text: 'claude env',
                  link: 'claude-env-vars'
               }
            ]
         }
      ],
      socialLinks: [{ icon: 'github', link: 'https://github.com/TTT1231' }],
      footer: {
         message: 'Released under the MIT License.',
         copyright: 'Copyright © 2025-present 涂仁伟'
      }
   }
});

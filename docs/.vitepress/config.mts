import { defineConfig } from 'vitepress';

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
               { text: '前端FAQ', link: '/frontdesign/common-problems' },
               { text: 'NuxtFAQ', link: '/nuxt/config-solutions' },
               { text: 'electron', link: '/electron' },
               { text: 'Node', link: '/server/Nodejs' },
               { text: 'Nest', link: '/server/Nestjs' },
               { text: 'vscode配置', link: '/code-style/vscode-setting' },
               { text: '代码格式化', link: '/code-style/eslint-format' }
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
                  text: '前端安全',
                  link: '/frontdesign/front-security'
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
                  text: '常见问题及其解决方案',
                  link: '/frontdesign/common-problems'
               }
            ]
         },
         {
            text: 'Nuxt全栈',
            collapsed: true,
            items: [
               { text: '目录结构', link: '/nuxt/catalog' },
               { text: '统一错误处理架构', link: '/nuxt/error-handle' },
               { text: '配置问题及其解决方案', link: '/nuxt/config-solutions' },
               { text: 'SEO-SSR', link: '/nuxt/seo-ssr' }
            ]
         },
         {
            text: 'electron',
            collapsed: true,
            link: '/electron'
         },
         {
            text: '代码风格和规范',
            collapsed: true,
            items: [
               { text: '格式化代码与检查', link: '/code-style/eslint-format' },
               { text: 'vscode编译器设置', link: '/code-style/vscode-setting' },
               { text: 'TsSchema', link: '/code-style/ts-schema' }
            ]
         },
         {
            text: '网络代理工具',
            collapsed: true,
            items: [
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

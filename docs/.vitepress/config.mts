import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
   lang: 'zh-CN',
   base: '/Turw-docs/', // Set to your desired base path
   title: '我的文档',
   description: '日常学习',
   head:[
      ['link', { rel: 'icon', href: '/Turw-docs/assets/favicon.ico' }],
   ],
   themeConfig: {
      logo: '/assets/logo.svg',
      nav: [
         { text: '主页', link: '/' },
         {
            text: '前端',
            items: [
               { text: 'FAQ', link: '/frontdesign/common-problems' },
               { text: 'Nuxt全栈', link: '/api-examples' }
            ]
         }
      ],

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
                  text: 'Nodejs',
                  link: '/frontdesign/Nodejs'
               },
               {
                  text: 'Vite',
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
                     { text: 'vue核心', link: '/frontdesign/vue3/vue-core' },
                     
                  ]
               },
               {
                  text: '常见问题及其解决方案',
                  link: '/frontdesign/common-problems'
               },
            ]
         },
         {
            text: 'Nuxt全栈',
            collapsed: true,
            items:[
               { text: '目录结构', link: '/frontdesign/nuxt/catalog' },
               { text: '统一错误处理架构', link: '/frontdesign/nuxt/error-handle' },
               { text: '配置问题及其解决方案', link: '/frontdesign/nuxt/config-solutions' }
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

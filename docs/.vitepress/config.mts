import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
   lang: 'zh-CN',
   base: '/Turw-docs/', // Set to your desired base path
   title: '我的文档',
   description: '日常学习',

   themeConfig: {
      logo: '/assets/logo.svg',
      nav: [
         { text: '主页', link: '/' },
         {
            text: '前端',
            items: [
               { text: 'FAQ', link: '/markdown-examples' },
               { text: 'Nuxt全栈', link: '/api-examples' }
            ]
         }
      ],

      sidebar: [
         {
            text: '前端',
            collapsed: false, 
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
                  text: 'VUE3',
                  collapsed: false,
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
            text: '微前端',
            collapsed: false,
            items: [
               { text: 'qiankun', link: '/mirco-frontdesign/qiankun' },
               { text: 'single-spa', link: '/mirco-frontdesign/single-spa' }
            ]
         },
         {
            text: 'Nuxt全栈',
            collapsed: false,
            items:[]
         },
         {
            text: '边缘计算',
            collapsed: false,
            items:[]
         },
         {
            text: 'AI智能体应用',
            collapsed: false,
            items:[]
         },
         
      ],
      socialLinks: [{ icon: 'github', link: 'https://github.com/TTT1231' }],
      footer: {
         message: 'Released under the MIT License.',
         copyright: 'Copyright © 2025-present 涂仁伟'
      }
   }
});

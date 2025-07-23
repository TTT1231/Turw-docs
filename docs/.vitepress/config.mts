import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  base: '/Turw-docs/', // Set to your desired base path
  title: "我的文档",
  description: "日常学习",
  
  themeConfig: {
    logo: '/public/assets/logo.svg',
    nav: [
      { text: '主页', link: '/' },
      { text: '前端',
        items:[
          { text: 'Examples', link: '/markdown-examples' },
          { text: 'API', link: '/api-examples' }
        ]
      }
    ],

sidebar: [
  {
    text: '前端',
    collapsed: false, // 默认展开
    items: [
      {
        text: 'CSS 布局',
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
        text: 'VUE3',
        collapsed: false,
        items: [
          { text: 'vue-router', link: '/frontdesign/vue3/vue-router' },
          { text: 'vuex', link: '/frontdesign/vue3/vuex' },
          { text: '性能优化', link: '/frontdesign/vue3/performance-optimize' },
          { text: 'vue面试', link: '/frontdesign/vue3/vuemeeting' }
        ]
      }
    ]
  }
],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/TTT1231' }
    ],
    footer:{
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present 涂仁伟'
    }
  }
})

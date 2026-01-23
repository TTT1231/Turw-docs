// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.scss';
import '../css/tailwind.css';
import FlexProperty from './components/FlexProperty.vue';
import GridProperty from './components/GridProperty.vue';
import CodeViewer from './components/CodeViewer/index.vue';
import ImgPreview from './components/ImgPreview.vue';

import NuxterrorHandling from './components/NuxterrorHandling.vue';
export default {
   extends: DefaultTheme,
   Layout: () => {
      return h(DefaultTheme.Layout, null, {
         // https://vitepress.dev/guide/extending-default-theme#layout-slots
      });
   },
   enhanceApp({ app, router, siteData }) {
      app.component('FlexProperty', FlexProperty);
      app.component('GridProperty', GridProperty);
      app.component('NuxterrorHandling', NuxterrorHandling);
      app.component('CodeViewer', CodeViewer);
      app.component('ImgPreview', ImgPreview);
   }
} satisfies Theme;

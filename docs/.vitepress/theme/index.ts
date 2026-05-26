// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
//@ts-ignore
import './style.scss';
//@ts-ignore
import '../css/tailwind.css';
import FlexProperty from './components/FlexProperty.vue';
import GridProperty from './components/GridProperty.vue';
import CodeMirrorCodeViewer from './components/CodeMirrorCodeViewer.vue';
import FoldCodeBlock from './components/FoldCodeBlock.vue';
import FoldCodeGroup from './components/FoldCodeGroup.vue';
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
      app.component('CodeViewer', CodeMirrorCodeViewer);
      app.component('CodeMirrorCodeViewer', CodeMirrorCodeViewer);
      app.component('FoldCode', FoldCodeBlock);
      app.component('FoldCodeBlock', FoldCodeBlock);
      app.component('FoldCodeGroup', FoldCodeGroup);
      app.component('ImgPreview', ImgPreview);
   }
} satisfies Theme;

// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './../../public/assets/css/tailwind.css';
import FlexProperty from './components/FlexProperty.vue';
import GridProperty from './components/GridProperty.vue';
import JwtValProcess from './components/JwtValProcess.vue';
import { messageKey } from './types/injectionKey';
import Tip from './components/code-hightlight/Tip.vue';
import Warning from './components/code-hightlight/Warning.vue';

import {
   Button as AButton,
   Card as ACard,
   message as AMessage,
   Select as ASelect,
   SelectOption as ASelectOption
} from 'ant-design-vue';
import NuxterrorHandling from './components/NuxterrorHandling.vue';
export default {
   extends: DefaultTheme,
   Layout: () => {
      return h(DefaultTheme.Layout, null, {
         // https://vitepress.dev/guide/extending-default-theme#layout-slots
      });
   },
   enhanceApp({ app, router, siteData }) {
      app.use(AButton);
      app.use(ACard);
      app.provide(messageKey, AMessage);
      app.use(ASelect);
      app.use(ASelectOption);

      app.component('FlexProperty', FlexProperty);
      app.component('GridProperty', GridProperty);
      app.component('NuxterrorHandling', NuxterrorHandling);
      app.component('JwtValProcess', JwtValProcess);
      app.component('Tip', Tip);
      app.component('Warning', Warning);
   }
} satisfies Theme;

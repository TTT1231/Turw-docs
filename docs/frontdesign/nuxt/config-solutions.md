---
outline: deep
---

# 配置问题及其常见解决方案

主要将nuxt4的项目配置问题和解决方案。

## ts类型提示问题

### tailwindcss配置问题及其类型不提示问题

@nuxt/tailwindcss是官方tailwindcss模块，当使用tailwind css V4文档安装时由于官方已经集成了该模块，因而不需要使用tailwind css V4，如果使用其文档安装，其中@tailwindcss/vite在nuxt.config.js中使用会有ts插件类型错误。这里最好的方式是使用<span class=" font-bold">@nuxt/tailwindcss官方模块</span>，然后在项目目录中，再次定义一个tailwind.config.js覆盖掉官方模块的默认配置用于自定义管理（以及配合tailwind类提示），然后在assets/css/[customer-name].css中引入tailwind 3 个css类，最后在nuxt.config.js中引入即可。最后的效果是自定义tailwindcss配置其余交给nuxt自动集成，形成最简、最易维护。😀

```js {2}
//============================== first add packages ================================
pnpm add -D @nuxtjs/tailwindcss
//============================== second add config =================================
export default defineNuxtConfig({
 // other codes
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss']
})
//============================== then create css file and add class ================
@tailwind base;
@tailwind components;
@tailwind utilities;
//【引用上面，这里可以自定义layer】

//================= final add tailwind.config.js file and add content ==============
/** @type {import('tailwindcss').Config} */
export default  {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### antd 类型提示问题（手动配置）

由于nuxt采用ts项目引用机制，tsconfig.json只负责引用`.nuxt/tsconfig*.json`这些子配置文件，而实际类型检查和包含逻辑都在这些子tsconfig文件里，因而只要类型文件（.d.ts）在app目录下，会被自动引入nuxt自动处理，因而为了统一管理，社区方式是所有类型声明文件全部处于types文件夹下。<span class=" text-blue-500  text-lg">开发中，最好引入到app目录下的.d.ts文件中</span>
这里的类型提示也可以直接去node_modules去找，然后引入即可（其实不用的话，也可以正常使用，只是来说开发环境不友好，ts类型推断为any，并且其属性也没有提示）<span class=" text-red-600">可以在开发的时候引入，然后开发完后可以删除，让nuxt自动处理</span>
<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
 antd 全局类型声明
</summary>

```ts
/* eslint-disable @typescript-eslint/consistent-type-imports */
declare module 'vue' {
  export interface GlobalComponents {
    AAffix: typeof import('ant-design-vue')['Affix'];

    AAlert: typeof import('ant-design-vue')['Alert'];

    AAnchor: typeof import('ant-design-vue')['Anchor'];

    AAnchorLink: typeof import('ant-design-vue')['AnchorLink'];

    AAutoComplete: typeof import('ant-design-vue')['AutoComplete'];

    AAutoCompleteOptGroup: typeof import('ant-design-vue')['AutoCompleteOptGroup'];

    AAutoCompleteOption: typeof import('ant-design-vue')['AutoCompleteOption'];

    AAvatar: typeof import('ant-design-vue')['Avatar'];

    AAvatarGroup: typeof import('ant-design-vue')['AvatarGroup'];

    ABadge: typeof import('ant-design-vue')['Badge'];

    ABadgeRibbon: typeof import('ant-design-vue')['BadgeRibbon'];

    ABreadcrumb: typeof import('ant-design-vue')['Breadcrumb'];

    ABreadcrumbItem: typeof import('ant-design-vue')['BreadcrumbItem'];

    ABreadcrumbSeparator: typeof import('ant-design-vue')['BreadcrumbSeparator'];

    AButton: typeof import('ant-design-vue')['Button'];

    AButtonGroup: typeof import('ant-design-vue')['ButtonGroup'];

    ACalendar: typeof import('ant-design-vue')['Calendar'];

    ACard: typeof import('ant-design-vue')['Card'];

    ACardGrid: typeof import('ant-design-vue')['CardGrid'];

    ACardMeta: typeof import('ant-design-vue')['CardMeta'];

    ACarousel: typeof import('ant-design-vue')['Carousel'];

    ACascader: typeof import('ant-design-vue')['Cascader'];

    ACheckableTag: typeof import('ant-design-vue')['CheckableTag'];

    ACheckbox: typeof import('ant-design-vue')['Checkbox'];

    ACheckboxGroup: typeof import('ant-design-vue')['CheckboxGroup'];

    ACol: typeof import('ant-design-vue')['Col'];

    ACollapse: typeof import('ant-design-vue')['Collapse'];

    ACollapsePanel: typeof import('ant-design-vue')['CollapsePanel'];

    AComment: typeof import('ant-design-vue')['Comment'];

    AConfigProvider: typeof import('ant-design-vue')['ConfigProvider'];

    AStyleProvider: typeof import('ant-design-vue')['StyleProvider'];

    ADatePicker: typeof import('ant-design-vue')['DatePicker'];

    ADescriptions: typeof import('ant-design-vue')['Descriptions'];

    ADescriptionsItem: typeof import('ant-design-vue')['DescriptionsItem'];

    ADirectoryTree: typeof import('ant-design-vue')['DirectoryTree'];

    ADivider: typeof import('ant-design-vue')['Divider'];

    ADrawer: typeof import('ant-design-vue')['Drawer'];

    ADropdown: typeof import('ant-design-vue')['Dropdown'];

    ADropdownButton: typeof import('ant-design-vue')['DropdownButton'];

    AEmpty: typeof import('ant-design-vue')['Empty'];

    AForm: typeof import('ant-design-vue')['Form'];

    AFormItem: typeof import('ant-design-vue')['FormItem'];

    AFormItemRest: typeof import('ant-design-vue')['FormItemRest'];

    AImage: typeof import('ant-design-vue')['Image'];

    AImagePreviewGroup: typeof import('ant-design-vue')['ImagePreviewGroup'];

    AInput: typeof import('ant-design-vue')['Input'];

    AInputGroup: typeof import('ant-design-vue')['InputGroup'];

    AInputNumber: typeof import('ant-design-vue')['InputNumber'];

    AInputPassword: typeof import('ant-design-vue')['InputPassword'];

    AInputSearch: typeof import('ant-design-vue')['InputSearch'];

    ALayout: typeof import('ant-design-vue')['Layout'];

    ALayoutContent: typeof import('ant-design-vue')['LayoutContent'];

    ALayoutFooter: typeof import('ant-design-vue')['LayoutFooter'];

    ALayoutHeader: typeof import('ant-design-vue')['LayoutHeader'];

    ALayoutSider: typeof import('ant-design-vue')['LayoutSider'];

    AList: typeof import('ant-design-vue')['List'];

    AListItem: typeof import('ant-design-vue')['ListItem'];

    AListItemMeta: typeof import('ant-design-vue')['ListItemMeta'];

    ALocaleProvider: typeof import('ant-design-vue')['LocaleProvider'];

    AMentions: typeof import('ant-design-vue')['Mentions'];

    AMentionsOption: typeof import('ant-design-vue')['MentionsOption'];

    AMenu: typeof import('ant-design-vue')['Menu'];

    AMenuDivider: typeof import('ant-design-vue')['MenuDivider'];

    AMenuItem: typeof import('ant-design-vue')['MenuItem'];

    AMenuItemGroup: typeof import('ant-design-vue')['MenuItemGroup'];

    AModal: typeof import('ant-design-vue')['Modal'];

    AMonthPicker: typeof import('ant-design-vue')['MonthPicker'];

    APageHeader: typeof import('ant-design-vue')['PageHeader'];

    APagination: typeof import('ant-design-vue')['Pagination'];

    APopconfirm: typeof import('ant-design-vue')['Popconfirm'];

    APopover: typeof import('ant-design-vue')['Popover'];

    AProgress: typeof import('ant-design-vue')['Progress'];

    AQuarterPicker: typeof import('ant-design-vue')['QuarterPicker'];

    ARadio: typeof import('ant-design-vue')['Radio'];

    ARadioButton: typeof import('ant-design-vue')['RadioButton'];

    ARadioGroup: typeof import('ant-design-vue')['RadioGroup'];

    ARangePicker: typeof import('ant-design-vue')['RangePicker'];

    ARate: typeof import('ant-design-vue')['Rate'];

    AResult: typeof import('ant-design-vue')['Result'];

    ARow: typeof import('ant-design-vue')['Row'];

    ASelect: typeof import('ant-design-vue')['Select'];

    ASegmented: typeof import('ant-design-vue')['Segmented'];

    ASelectOptGroup: typeof import('ant-design-vue')['SelectOptGroup'];

    ASelectOption: typeof import('ant-design-vue')['SelectOption'];

    ASkeleton: typeof import('ant-design-vue')['Skeleton'];

    ASkeletonAvatar: typeof import('ant-design-vue')['SkeletonAvatar'];

    ASkeletonButton: typeof import('ant-design-vue')['SkeletonButton'];

    ASkeletonImage: typeof import('ant-design-vue')['SkeletonImage'];

    ASkeletonInput: typeof import('ant-design-vue')['SkeletonInput'];

    ASlider: typeof import('ant-design-vue')['Slider'];

    ASpace: typeof import('ant-design-vue')['Space'];

    ASpaceCompact: typeof import('ant-design-vue')['Compact'];

    ASpin: typeof import('ant-design-vue')['Spin'];

    AStatistic: typeof import('ant-design-vue')['Statistic'];

    AStatisticCountdown: typeof import('ant-design-vue')['StatisticCountdown'];

    AStep: typeof import('ant-design-vue')['Step'];

    ASteps: typeof import('ant-design-vue')['Steps'];

    ASubMenu: typeof import('ant-design-vue')['SubMenu'];

    ASwitch: typeof import('ant-design-vue')['Switch'];

    ATabPane: typeof import('ant-design-vue')['TabPane'];

    ATable: typeof import('ant-design-vue')['Table'];

    ATableColumn: typeof import('ant-design-vue')['TableColumn'];

    ATableColumnGroup: typeof import('ant-design-vue')['TableColumnGroup'];

    ATableSummary: typeof import('ant-design-vue')['TableSummary'];

    ATableSummaryCell: typeof import('ant-design-vue')['TableSummaryCell'];

    ATableSummaryRow: typeof import('ant-design-vue')['TableSummaryRow'];

    ATabs: typeof import('ant-design-vue')['Tabs'];

    ATag: typeof import('ant-design-vue')['Tag'];

    ATextarea: typeof import('ant-design-vue')['Textarea'];

    ATimePicker: typeof import('ant-design-vue')['TimePicker'];

    ATimeRangePicker: typeof import('ant-design-vue')['TimeRangePicker'];

    ATimeline: typeof import('ant-design-vue')['Timeline'];

    ATimelineItem: typeof import('ant-design-vue')['TimelineItem'];

    ATooltip: typeof import('ant-design-vue')['Tooltip'];

    ATransfer: typeof import('ant-design-vue')['Transfer'];

    ATree: typeof import('ant-design-vue')['Tree'];

    ATreeNode: typeof import('ant-design-vue')['TreeNode'];

    ATreeSelect: typeof import('ant-design-vue')['TreeSelect'];

    ATreeSelectNode: typeof import('ant-design-vue')['TreeSelectNode'];

    ATypography: typeof import('ant-design-vue')['Typography'];

    ATypographyLink: typeof import('ant-design-vue')['TypographyLink'];

    ATypographyParagraph: typeof import('ant-design-vue')['TypographyParagraph'];

    ATypographyText: typeof import('ant-design-vue')['TypographyText'];

    ATypographyTitle: typeof import('ant-design-vue')['TypographyTitle'];

    AUpload: typeof import('ant-design-vue')['Upload'];

    AUploadDragger: typeof import('ant-design-vue')['UploadDragger'];

    AWeekPicker: typeof import('ant-design-vue')['WeekPicker'];

    AQrCode: typeof import('ant-design-vue')['QRCode'];

    ATour: typeof import('ant-design-vue')['Tour'];

    AFloatButton: typeof import('ant-design-vue')['FloatButton'];

    AFloatButtonGroup: typeof import('ant-design-vue')['FloatButtonGroup'];

    ABackTop: typeof import('ant-design-vue')['BackTop'];

    AWatermark: typeof import('ant-design-vue')['Watermark'];

    AFlex: typeof import('ant-design-vue')['Flex'];
  }
}
export {};

```
</details>

### antd样式闪烁问题

由于服务器渲染如果antd样式在服务器中没有引入会导致客户端异步加载样式导致css样式问题（也即渲染后css没有立即加载问题）.。**在nuxt中SSR引入**nuxt.config.ts
```js
//定义一个SSR的插件 antd.server.ts
export default defineNuxtConfig({
  css: [
    'ant-design-vue/dist/antd.css'
  ] //会在客户端和服务端都加载，而在客户端由于css异步加载，且异步加载都造成闪烁
})
```  
当然加载是antd全量css文件，打包后会文件大很多。  
这里**最好的方式**是使用官方组件@ant-design-vue/nuxt
```js
//推荐解决方式
//1----add package
pnpx nuxi@latest module add ant-design-vue
//2----make sure correctly pick(nuxt.config.ts)
antd:{extraStyle:true} //按需提取和注入 css，默认为 false
//3----use advanced css,make sure option open——2 step
<template>
  <a-extract-style>
    <!-- Your page or component -->
  </a-extract-style>
</template>
```

### eslint修复代码nuxt.config.ts报错问题

由于eslint找不到我们的TS的顶层依赖项，如果没有安装它隐藏在nuxt后面，导致报错defineNuxt，解决办法是直接安装它**pnpm install -D typescript**






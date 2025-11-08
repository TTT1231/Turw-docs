# CSS

这个文档是有关于css的示例和详解。

## Flex Layout

flex布局默认方向是水平摆放即`flex-direction:row` 即主轴方向。还有一根交叉轴与主轴垂直。其主要提供一种有效的方式来对容器中的项目进行排列、对齐和分配空间，即使它们的大小是未知或动态的。

### 交互式属性选择器

通过下拉菜单选择不同的Flex属性值，实时查看代码和效果：

<FlexProperty/>
### justify-content (主轴对齐) - （tailwindcss写法）
- `justify-content: flex-start;` - `justify-start`（默认值，左对齐）
- `justify-content: flex-end;` - `justify-end`（右对齐）
- `justify-content: center;` - `justify-center`（居中对齐）
- `justify-content: space-between;` - `justify-between`（两端对齐）
- `justify-content: space-around;` - `justify-around`（环绕对齐）
- `justify-content: space-evenly;` - `justify-evenly`（平均分布）
- `justify-content: stretch;` - `justify-stretch`（把内容拉伸）
::: tip
后面有一个`safe`(css)，防止内容溢出容器，在css中直接加入即可`safe`，但是tailwindcss不支持。
:::
<div class=" justify-items-stretch justify-stretch"></div>

### align-items (交叉轴对齐方式) - （tailwindcss写法）

| CSS          | Tailwind         | 说明                                         |
| ------------ | ---------------- | -------------------------------------------- |
| `stretch`    | `items-stretch`  | 默认值，拉伸填充交叉空间                     |
| `flex-start` | `items-start`    | 交叉轴起始对齐（水平时顶部、垂直时左侧）     |
| `flex-end`   | `items-end`      | 交叉轴末端对齐（水平时底部、垂直时右侧）     |
| `center`     | `items-center`   | 交叉轴居中（水平时垂直居中、垂直时水平居中） |
| `baseline`   | `items-baseline` | 文字基线对齐                                 |

### flex-direction (主轴方向) - Tailwind CSS 写法

- `flex-direction: row;` - `flex-row` (默认值，水平排列)
- `flex-direction: row-reverse;` - `flex-row-reverse` (水平反向排列)
- `flex-direction: column;` - `flex-col` (垂直排列)
- `flex-direction: column-reverse;` - `flex-col-reverse` (垂直反向排列)

### flex-wrap (换行控制) - Tailwind CSS 写法

- `flex-wrap: nowrap;` - `flex-nowrap` (默认值，不换行)
- `flex-wrap: wrap;` - `flex-wrap` (允许换行)
- `flex-wrap: wrap-reverse;` - `flex-wrap-reverse` (反向换行)

### flex (子项伸缩) - Tailwind CSS 写法

- `flex: 0 1 auto;` - `flex-initial` (默认值，不放大，可缩小)
- `flex: 1 1 0;` - `flex-1` (平均分配剩余空间)
- `flex: 1 1 auto;` - `flex-auto` (基于内容大小分配空间)
- `flex: none;` - `flex-none` (固定大小，不放大不缩小)

## Grid Layout

grid布局是一个二维布局系统，同时处理多行多列。与flex布局(一维布局系统)相比，grid更适合创建复杂的网页布局。一般用来实现多栏布局方便实现自适应和重排布局。因而更适合需要控制行和列的场景。

<GridProperty/>

### grid-template-columns (定义列和列的宽度) - （tailwindcss写法）

#### 基础列定义

| CSS 属性                                                                    | Tailwind 类                                                   | 说明                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `grid-template-columns: none;`                                              | `grid-cols-none`                                              | 默认值，不会自动生成列                          |
| `grid-template-columns: 1fr 2fr 1fr;`                                       | `grid-cols-[1fr_2fr_1fr]`                                     | 按照剩余空间比例分配（1:2:1）                   |
| `grid-template-columns: minmax(min-content, 1fr) minmax(min-content, 1fr);` | `grid-cols-[minmax(min-content,1fr)_minmax(min-content,1fr)]` | 每列先按内容最小宽度，再分配剩余空间（2列示例） |

#### 响应式自适应布局

| CSS 属性                                                    | Tailwind 类                                       | 说明                                       |
| ----------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `grid-template-columns:repeat(auto-fit,minmax(200px,1fr))`  | `grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`  | 每列最小 200px，剩余空间平分，自动换行     |
| `grid-template-columns:repeat(auto-fit,minmax(200px,auto))` | `grid-cols-[repeat(auto-fit,minmax(200px,auto))]` | 每列最小 200px，最大根据内容扩展，自动换行 |

#### 列定位与跨度

| CSS 属性               | Tailwind 类             | 说明                       |
| ---------------------- | ----------------------- | -------------------------- |
| `grid-column-start: 2` | `col-start-2`           | 从第 2 列开始              |
| `grid-column-end: 2`   | `col-end-2`             | 到第 2 列结束              |
| `grid-column: 2 / 5`   | `col-start-2 col-end-5` | 从第 2 列开始，第 5 列结束 |
| `grid-column: span 2`  | `col-span-2`            | 跨越 2 列（仅用于子元素）  |

#### repeat() 参数说明

- `auto-fit` - 尽量多放置网格项，多余空间收缩为 0
- `auto-fill` - 尽量多放置网格项，多余空间不会收缩

### grid-template-rows (定义行和行的宽度，与上诉的grid-template-cols类似)

> [!TIP]
> repeat(重复次数, 列宽度)，表示在列中重复多少次，简化重复列或者行的写法。例如repeat(4,1fr)表示4列，每列宽度都是1fr。

## 图片清晰度问题

原始尺寸 = 样式尺寸（原始图片的长和宽） \* DPR（devicePixelRatio）  
srcset提供多个图片源，让游览器自行选择（要提供多个图片不同尺寸大小）示例

```js
//其中 1x表示DPR的值，要保持上诉公式成立
<img
   srcset="
    example.com/id/img1_1 1x,
    example.com/id/img1_2 2x, 
"
/>
```

img还有一个size属性，目的时在告诉游览器在不同视口（viewport）或布局条件下，图片实际会显示的宽度是多少，从而让游览器选择最合适的图片。例如

```js
//size后面表示
//当视口宽度<= 600px时，图片显示宽度为400ox;
//其他情况下，图片显示宽度为800px
<img
   srcset="
    example.com/id/img1_400.jpg 400w,
    example.com/id/img1_800.jpg 800w
  "
   sizes="(max-width: 600px) 400px, 800px"
   src="example.com/id/img1_800.jpg"
   alt="示例图片"
/>
```

## CSS选择器-tailwind写法

注意：**&**在tailwind中表父级

```css {3,7,11,15}
/* 特定[target-element][attribute] 指定元素指定属性 */
[attribute] 属性选择器——例：[nihao]选中所有**nihao**属性。
[attributeName-attributeVal]:some css

/* 子选择器，直接作用子元素，仅作用一代 */
father-ele > child-ele
[father-ele(&)>child-ele]:some css

/* 相邻兄弟选择器——选择紧接在某个元素后的第一个兄弟元素。 */
father-ele + brother-ele
[father-ele(&)+brother-ele]:some css【推荐peer和adjacent】

/* 通用兄弟选择器 —— 所有同级别的孩子元素也即同级别*/
father-ele ~ all-child-ele
[father-ele(&)_all-child-ele]:some css
```

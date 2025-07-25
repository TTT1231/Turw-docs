# CSS Layout Examples

这个文档是有关于css的布局示例和详解。

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

### align-items (多轴线对齐方式) - （tailwindcss写法）

- `align-items: stretch;` - `items-stretch`（默认值，子项被拉伸填充整个交叉空间，子项高度相等可以使用）
- `align-items: flex-start;` - `items-start`（子项对齐交叉轴的起始位置，水平布局时-顶部对齐，垂直布局时-左侧对齐）
- `align-items: flex-end;` - `items-end`（子项对齐到交叉轴的结束位置，水平布局时-底部对齐，垂直布局时-右侧对齐）
- `align-items: center;` - `items-center`（子项在交叉轴上居中对齐，水平布局时=垂直居中，垂直布局时-水平居中）
- `align-items: baseline;` - `items-baseline`（子项按照文字基线对齐，当包含不同字体大小文字时，确保文字基

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

- `grid-template-columns: none;` - `grid-cols-none` (默认值，不会自动生成列)
- `grid-template-columns: 1fr 2fr 1fr;` - `grid-cols-[1fr_2fr_1fr]` (不是按照内容，而是按照剩余空间比例直接分配)
- `grid-template-columns: minmax(min-content, 1fr) minmax(min-content, 1fr);` - `grid-cols-[minmax(min-content,1fr)_minmax(min-content,1fr)]` (每列先按照内容最小宽度，然后再分配剩余空间。这里以2列为例)
- `grid-template-columns:repeat(auto-fit,minmax(200px,1fr))` - `grid-cols-[repeat(auto-fit,minmax(200px,1fr))]` (表示每列最小200px，最大剩余空间平分，并自动适应容器宽度)
- `grid-template-columns:repeat(auto-fit,minmax(200px,auto))` - `grid-cols-[repeat(auto-fit,minmax(200px,auto))]` (表示每列最小200px，最大根据内容自动扩展，并自动适应容器宽度)
- `grid-colums-start:2` - `col-start-2` (表示网格从第几列开始,这里是第二列开始)
- `grid-colums-end:2` - `col-end-2` (表示网格从第几列结束这里是第二列结束)
- 例如网格从第二列开始第5列结束则`col-start-2 col-end-2`
- `col-span-2` 只能用在子元素类中，表示这个元素跨越几列(表示元素跨越两列)。
- `auto-fit` (表示尽量多放置网格项，多余空间收缩为0) repeat可选参数。
- `auto-fill` (表示尽量多放置网格想，多余空间不会收缩) repeat可选参数。

### grid-template-rows (定义行和行的宽度，与上诉的grid-template-cols类似)

<span class=" text-red-500">注: </span>
<span class="font-semibold">repeat(重复次数, 列宽度)，表示在列中重复多少次，简化重复列或者行的写法。例如repeat(4,1fr)表示4列，每列宽度都是1fr。</span>

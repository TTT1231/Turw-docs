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
后面有一个`safe`(css),防止内容溢出容器,在css中直接加入即可`safe`,但是tailwindcss不支持。
:::
<div class=" justify-items-stretch justify-stretch"></div>

### align-items (多轴线对齐方式) - （tailwindcss写法）
- `align-items: stretch;` - `items-stretch`（默认值，子项被拉伸填充整个交叉空间，子项高度相等可以使用。）
- `align-items: flex-start;` - `items-start`（子项对齐交叉轴的起始位置，水平布局时-顶部对齐，垂直布局时-左侧对齐。）
- `align-items: flex-end;` - `items-end`（子项对齐到交叉轴的结束位置，水平布局时-底部对齐，垂直布局时-右侧对齐。）
- `align-items: center;` - `items-center`（子项在交叉轴上居中对齐，水平布局时=垂直居中，垂直布局时-水平居中。）
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


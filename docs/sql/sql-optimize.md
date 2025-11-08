# SQL优化

## 索引优化

索引：核心提高数据库的查询速度（空间换时间），**适合频繁需要的查询，但是不能经常更新索引，否则索引需要经常更新得不偿失**

索引type

- NORMAL 普通索引，只是单纯加快查询速度，基本索引类型。
- UNIQUE 唯一索引，加快查询速度的同时，强制要求索引列唯一。
- FULLTEXT 全文索引，与搜索引擎类似，查找文本中关键词等。
- SPATTAL 空间索引，用于点、线、
  面等地理位置和空间查询。

索引method

- BTREE b树索引方法，**绝大部分通用索引方法**，支持范围和like查询，速度（O(log n)）
- HASH hash索引，只能支持等值索引，速度非常快（O（1）计算hash），但是更依赖hash表

使用索引一般使用**唯一索引跟B树**就可以了

```ts
//typeorm 索引

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class User {
   @PrimaryGeneratedColumn()
   id: number;

   @Index({ unique: true })
   @Column()
   firstName: string;

   @Column()
   @Index({ unique: true })
   lastName: string;
}
```

## 高频查询结果缓存

如果以typeorm为例子，只需在对于查询中配置cache即可。

```ts
// options type (毫秒为单位)
cache: boolean | number;

//example
const selectCache = selectCacheRepo.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   },
   cache: 1000 //1s
});
```

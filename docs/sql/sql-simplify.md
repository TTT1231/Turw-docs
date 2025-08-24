# SQL简化

在后端中，在实际开发业务流程中，我们需要经常编写简单sql语句，导致维护困难 当拓展表结构时要修改类型结构，和SQL语句导致维护困难【排除java springboot】 。

这里不考虑select \*情况，该情况会有泄漏字段和性能、索引、过耦合问题。

其中**数据库Schema、orm实体类似java的注解、prisma模型、文档数据库模型**
能极大简化对应SQL语句编写，使其维护简单。这里以`typeorm`为例。

## typeorm

typeorm将表看成一个对象，所有操作都看作对象的操作，将SQL操作表迁移到对象操作，如果考虑**性能优化** 的情况下，使用`typeorm`会有性能损失，因为它会将对象操作转化SQL有性能损失，同时如果涉及子查询、复杂SQL编写，其缺点显著。

<span class="text-blue-400">因而平衡性能跟效率的情况下，针对复杂查询或者大批量更新、增加等，退回到SQL操作，而对于简单SQL则使用typeorm对象操作，使得维护和开发变得简单。</span>  
<span class="text-red-400">问题核心是：orm中create实体save大批量很慢，而几个或者多个与原始SQL性能相比差异很小，复杂查询没原始SQL语句好维护，但涉及多个子查询时性能下降多，且最重要一点编写quertBuilder很困难，即使编写完了维护变得极为困难。</span>

## orm操作

​​O​​bject-​​R​​elational ​​M​​apping（对象-关系映射）,解决手写简单SQL后，拓展表或维护困难等问题。ORM将表看作一个对象，从操作对象的角度考虑去操作数据库当中的表【面向对象设计】，使得开发效率加快和维护变得更加简单。  
**对于复杂子查询等，为了更加直观和性能以及维护等考虑，退回SQL处理最好，只需单独管理即可**

### 创建表

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    创建实体和列（类似数据库中表）
</summary>

```ts
import { Entity, Column } from 'typeorm';
/**
 * Entity主要配置参数options->{options}
 * @param name?:string    数据库表名，默认就是实体名(小写)，最佳的话要自己设置，避免自动生成带来的意外
 * @param engine?:string  存储引擎，MySQL使用新式引擎即可 InnoDB ，支持事务、锁 、外键约束，在首次创建或者迁移生效，不会去修改已存在表引擎
 * @param database?string  用于跨数据库，指定实体所在数据库名，如果单一数据库的话，默认使用连接池中配置就可以了
 * @param  synchronize?: boolean 同步实体，默认true，orm会自动同步所有实体结构【会被默认全局datasource数据源中synchronize覆盖掉，全局优先级最高】
 * @param schema?:string   postgreSQL、sql server专用
 * @param withoutRowid?:boolean SQLite数据库专用，禁止默认rowid主键行为
 * @param comment?:string  表注释
 *
 * @description mysql单数据库只需设置name、comment注释即可
 */

/**
 * Column主要配置参数options->{options}
 * @param type?: ColumnType 列数据类型，默认orm自动推断，性能考虑下显示指定即可
 * @param name?:string      列名
 * @param length?: string | number  字符串的最大长度，或数值类型的长度
 * @param precision?: number | null& scale?: number 精度，一般用于精确小数位
 * @param unsigned?: boolean& zerofill?: boolean MySQL专用(不能为负数)
 * @param nullable?: boolean 是否允许为空，默认false
 * @param primart? :boolean 是否为主键
 * @param unique?: boolean 是否创建该字段唯一约束
 * @param default?: any 默认值
 * @param onUpdate?: string MySQL专用，UPDATE操作触发的SQL字段，通常用于时间戳自动更新
 * @param comment?: string 列字段注释
 * @param enum?: (string | number)[] | Object 自定义枚举类型
 * @param select?: boolean 设置为false时，使用find或者QueryBuilder进行查询，该字段不会被选中
 * @param insert?: boolean& update?: boolean 控制字段是否包含INSERT或UPDATE
 * @param transformer 字段写入或者读出进行转换（一般用于加密、解密，序列化等）
 *
 * @description MySQL单数据库只需设置type、name、comment注释，其他看情况，主键定义用@PrimaryColumn注释或@PrimaryGeneratedColumn（自动递增）即可，用这个定义阅读性会更好
 */
@Entity({ name: db_testentity })
export class YourEntity {
   @Column() //表中列
   id: number;
   // other fileds
}
```

</details>

### 表关系定义和操作

<span class="text-red-400">当引入了软删除后，会污染所有数据库，增加对软删除的支持，复杂度会显著增加  
，在考虑简化复杂查询迁移到原生SQL要考虑软删除问题，和软删除的<span class=" font-bold">累计效应</span>，和逻辑复杂化。  
【原生SQL很难判断ORM软删除状态，而且原生SQL对软删除的数据在数据库默认是有的】</span>

<span class="text-blue-400">
   注意：在定义**双向关系**的时候，必须要接受orm中的第一个反射参数，该参数是目标实体实例，并指向当前实体属性，让orm理解。
</span>
<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    定义表字段映射关系（关系数据库）
</summary>

```ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
/**
 * OneToMany,ManyToOne配置,还有OneToOne差不多，需要注意的是OneToOne
 * 需要设置JoinColumn定义外键拥有者，也即JoinColumn的位置，里面的option的name
 * 对应表中字段名（可以随意取，但是该名会映射到表中去，因此符合实际命名最好）----类似数据库外键列名
 * 多对多关系ManyToMany类似，它更加自由点没那么多约束。
 * [持有方，对应方(反向关系指示器，对应方->持有方)，参数options]
 *
 * options:
 * @param cascade: boolean | ("insert" | "update" | "remove" | "soft-remove" | "recover")[]
 * 其中cascade:true表示启用所有级联操作相当于【"insert", "update", "remove", "recover"】
 * 或者使用数组精细控制，也就是【?"insert", ?"update", ?"remove", ?"recover"】,?表可选
 * -insert 保存父实体时，同时保存关联的新子实体（尚未在数据库中存在）。【insert级联】
 * -update 更新父实体时，同时更新所有子管理实体【update级联】
 * -remove 删除父实体时，同时删除所有关联的子实体【delete级联，注意恢复recover操作】
 * -soft-remove 软删除，在orm应用层实现，数据库不会有任何变化，主要用于审计追踪和数据恢复 ，
 * 如果考虑数据库恢复，需要将恢复备份，而且当内容多的时候备份极为困难，如何关闭数据库进行恢复会影响所有用户。
 * 因而应用层面的软删除不会操作数据库、防误操作很好，便捷。【审计分离，数据库审计与ORM应用层职责分离，数据库负责
 * 谁进入了数据库，执行了什么操作，而ORM软删除审计记录事件、和业务语义，最后的删除操作肯定也需要再一次的人工审核，
 * 或者定义审核和执行真正的删除，注意考虑累计效应】
 * -recover 软恢复删除的实体
 * @param  nullable?: boolean  外键是否可以为null
 * @param  onDelete?:"RESTRICT" | "CASCADE" | "SET NULL" | "DEFAULT" | "NO ACTION"
 * 从数据库中删除某些关系时的删除策略
 * -CASCADE 级联删除
 * -SET NULL 设置为空
 * -RESTRICT或NO ACTION （​​默认行为​​）​​拒绝删除​​
 * @param onUpdate 同上类似，很少用，用于定义更新时应该的操作
 * @param createForeignKeyConstraints?: boolean = true 是否在数据库中为此关系创建外键约束
 * @param lazy?:boolean  懒加载 【互斥】
 * @param eager?:boolean 急加载 【互斥】
 * @param persistence?: boolean = true 持久化，当调用save时，自动更新外键值
 * @param orphanedRowAction?: "nullify" | "delete" | "soft-delete" | "disable"
 * 当一个父行被保存（虽然有级联，但数据库中没有仍然存在的子行）时，这将控制它们会发生什么。
 * delete将从数据库中删除这些行。nullify将删除关系键。
 * disable将保持关系不变。只有通过其自己的回购才能删除相关项目。
 *
 * @description 通常根据场景配置
 * -业务逻辑直接配置cascade或者onDelete
 * -nullable
 * -自动加载外键关联数据：eager，关联太多有性能问题
 * -性能优化：createForeignKeyConstraints考虑将其设置false
 */

@Entity({ name: 'test1' })
export class Entity_1 {
   @PrimaryGeneratedColumn({
      comment: '主键(自动递增)'
   })
   id: number;

   //一对多
   @OneToMany(() => Entity_2, (entity2) => entity2.entity1) // 这里指向 Entity_2 的 entity1
   entity2s: Entity_2[];
}

@Entity({ name: 'test2' })
export class Entity_2 {
   @PrimaryGeneratedColumn({
      comment: '主键(自动递增)'
   })
   id: number;

   // 多对一关系：多个 Entity_2 对应一个 Entity_1
   @ManyToOne(() => Entity_1, (entity1) => entity1.entity2s, _) //_options占位
   @JoinColumn({ name: 'entity1_id' }) // 指定外键列名
   entity1: Entity_1;
}
```

</details>

### 定义连接数据库的配置和使用

**在DataSource调用initialize的时候，会建立单数据库单例模式的连接池**  
**访问这个数据库操作，直接从连接池取值就可以了**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   数据库连接配置和初始化连接池
</summary>

```ts
import { DataSource } from 'typeorm';
import { User } from './models/User';

export const AppDataSource = new DataSource({
   type: 'mysql',
   host: 'localhost',
   port: 3306,
   username: 'test',
   password: 'test',
   database: 'test',
   synchronize: true, //是否应在每次启动应用程序时自动创建数据库架构，生产模式关闭
   logging: false,
   entities: [User],
   migrations: [],
   subscribers: []
});

//plugins/dbinit.ts,【注意import "reflect-metadata"全局访问api，若没有加载访问
// @等修饰器会报错】
import 'reflect-metadata';
import AppDataSource from '[your-dir]';

let isInitialized = false;
//注意异步传染性
export default async function setupDBPool() {
   if (!isInitialized) {
      await AppDataSource.initialize();
      isInitialized = true;
   }

   return AppDataSource;
}

//service.ts
import { AppDataSource } from '[target-datasource]'; // 直接导入已初始化的实例

export class UserService {
   constructor(private userRepo = AppDataSource.getRepository(User)) {}

   //add user if success return insert user obj
   async createUser(userData: UserData) {
      try {
         // 1. 创建实体实例（不立即插入数据库）
         const newUser = this.userRepo.create(userData);

         // 2. 保存到数据库（执行INSERT）
         return await this.userRepo.save(newUser);
      } catch {
         //db error or other error
      }
   }
}
```

</details>

## find查询

**这里配置的cache选项，跟synchronize不同，synchronize全局会覆盖掉自定义，即使配置或没有配置情况下，而cache会覆盖掉全局这个cache选项，全局没有设置缓存，但具体Repository设置了cache此时缓存会生效**

<span class="text-red-400">
   如果考虑性能优化、在锁中除了必要的一致性和原子性操作外，或者核心业务流程外，其他就能不用锁就不用锁，或者错开写读时间避免引发一致性问题等。和缓存的使用。
</span>

锁在并发中性能损失多用户体验不好，而且用的时候最好是在事务中使用【事务中有**原子性、一致性、和最重要的隔离性**】，同时注意锁的使用确保**最快用完最快归放**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   find配置
</summary>

```ts
const userTableObj = AppDataSource.getRepository(User)

//======================================配置===================================================
//find Options defined type
userRepository.find({
   //obj type
   select:FindOptionsSelect<Entity>, //手动设置对应字段的boolean，为true表示投影要返回

   //obj type
   //类似 where field1 = con1 AND field2 = con2【AND语法】
   //OR语法只需在字段前用{}分割出来，即{field1:[con1]},{field2:[con2]}
   where:FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity>,

   //用于eager加载关联数据，不加外键关联关系会被orm置空
   relations: FindOptionsRelations<Entity>
   order: {
      field1: "ASC",
      field1: "DESC",
      ...
   }
   transaction?: boolean; //查询是否在事务中执行，默认false

   //在进行性能优化时，尤为好用，启用缓存的意思、默认1s也可以传入number进行设置(单位ms)
   cache:boolean|number;

   //===========分页相关开始=============
   //注意排序，和知道数据总数，这是分页所必须的
   skip:[target-number] //从第几条开始,类似跳过意思
   take:[target-number] //一次取多少条记录
   //===========分页相关结束=============

   //===========锁相关开始=============
   lock?: { //乐观锁
      mode: "optimistic";
      version: number | Date;   //验证数据是否变化的​​依据，自定义提供
   }|{//悲观锁
      mode: "pessimistic_read" | "pessimistic_write" | "dirty_read" | "pessimistic_partial_write" | "pessimistic_write_or_fail" | "for_no_key_update" | "for_key_share";
      tables?: string[];//加锁的表
      onLocked?: "nowait" | "skip_locked";//被锁定的行为，nowait不等待直接抛出错误，skip_locked跳过锁
    };
   //===========锁相关结束=============
});

```

</details>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   find操作例子
</summary>

```ts
const userTableObj = AppDataSource.getRepository(User);

//select * from users
const selectAllUser = await userTableObj.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   }
});
console.log('selectAllUser', selectAllUser);

//select * from users where id = 1
const selectTargetUser1 = await userTableObj.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   },
   where: {
      id: 1 //可以使用dynamic value
   }
});

//select * from users where id = 1 AND age = 25
const selectTargetUser2 = await userTableObj.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   },
   where: {
      id: 1,
      age: 25
   }
});

//select * from users where id = 1 OR age = 25
const selectTargetUser3 = await userTableObj.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   },
   where: [
      {
         id: 1
      },
      {
         age: 25
      }
   ]
});

// <= LessThanOrEqual >= MoreThanOrEqual != Not,between,In,Null and not null
//select * from users where id >= 1
const selectTargetUser4 = await userTableObj.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   },
   where: {
      id:MoreThan(1) //>=
      // id:LessThan(2) //<=
      // id:Not(2) //!=
      // id:Between(1,2)
      // id:In([1,2]) //id in (1,2)
      // id:IsNull() //id is null
      // id:Not(IsNull()) //id is not null
   }
});

//cache 1s 用于提高查询性能，提高高并发性能问题，解决重复查询
//select * from users
const selectTargetUser5 = userTableObj.find({
   select: {
      id: true,
      firstName: true,
      lastName: true,
      age: true
   },
   cache: 1000 //1s
});
```

</details>

# 鉴权和webSocket

## 鉴权策略

采用passport 策略进行快速验证，`jwt.guard.ts`负责执行`jwt.strategy.ts`，
自定义一个`AuthHttpPublic`装饰器被guard进行守卫不守卫

## webSocket

根据webSocket进行鉴权，为了速率与鉴权的平衡，采用定时器心跳进行检测

## 自定义全局过滤器

根据需要进行即可

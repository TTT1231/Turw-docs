import { Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';
import { AUTH_PUBLIC_HTTP_KEY } from '../decorator/public.decorator';

@Injectable()
/**
 * WebSocket Gateway 的 Guard 执行时机问题：
 * @UseGuards() 在 WebSocket Gateway 类级别不会在连接时执行
 * Guard 只在 @SubscribeMessage() 装饰的消息处理器上执行
 * handleConnection 钩子在任何 Guard 之前执行
 * 但是，我们可以通过自定义 WebSocket 适配器或者使用中间件来在连接时进行验证。让我给你展示正确的方法：
 */

//extends AuthGuard('jwt') 返回一个动态生成的类，已经完成了super的构造
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super(); // ← 这里不需要传参数
  }
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const authHttpPublic = this.reflector.getAllAndOverride<boolean>(AUTH_PUBLIC_HTTP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (authHttpPublic) {
      return true; // 直接放行
    }

    return super.canActivate(context);
  }
}

import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthHttpPublic } from './decorator/public.decorator';
import type { UserEntity } from './types/userEntitty';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @AuthHttpPublic() // 标记此路由为公开路由，不需要 JWT 验证
  login(@Body() userDTO: UserEntity) {
    console.log('登录请求：', userDTO);
    return this.authService.login(userDTO.username);
  }

  @Get('test-jwt')
  testJwt(@Req() req: any) {
    console.log('请求用户信息：', req?.user);
    return 'JWT 验证成功，访问受保护的路由成功！';
  }
}

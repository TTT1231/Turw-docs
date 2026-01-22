import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './config/jwt.config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // 生成/签发 jwt token
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: '120s',
        // 使用 HS256 算法（对称加密），与 secret 字符串匹配
        // 如果要用 RS512，需要使用 privateKey 和 publicKey
        algorithm: 'HS256',
      },
      global: true, // 全局可用jwtService
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService], // 如果其他模块需要使用 AuthService，需要导出
})
export class AuthModule {}

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../config/jwt.config';
import { AuthService } from '../auth.service';
import type { UserEntity } from '../types/userEntitty';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // HTTP: Authorization: Bearer <token>
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // 这里必须配置，用于验证 token
      algorithms: ['HS256'], // 指定算法，与 JwtModule 中的 algorithm 保持一致
    });
  }

  /**
   * jwt 验证正确后的回调
   * payload 是从 token 中解析出来的数据（已经通过密钥验证了签名）
   *
   * 这里的职责：
   * 1. JWT 签名已经验证通过（由 passport-jwt 自动完成）
   * 2. 这里需要做业务层面的二次验证：
   *    - 用户是否还存在？
   *    - 用户是否被禁用？
   *    - 用户角色是否变更？
   */
  async validate(payload: UserEntity): Promise<UserEntity> {
    console.log('jwt 签名验证成功，开始业务验证', payload);

    // 1. 检查用户是否仍然存在（可能已被删除）
    const user = await this.authService.findUserById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 2. 检查用户是否被禁用
    const isActive = await this.authService.isUserActive(payload.userId);
    if (!isActive) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 3. 返回的数据会被挂载到 request.user 上
    // 你可以返回更多信息，比如从数据库查询的最新用户信息
    return user;
  }
}

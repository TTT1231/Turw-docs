import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserEntity } from './types/userEntitty';
import { dbUsers } from './db/user';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * 登录方法 - 验证用户名密码，生成 JWT token
   * 这是 AuthService 的主要职责
   */

  login(username: string) {
    // 1. 验证用户名密码（这里简化处理，实际应该验证密码哈希）
    const user = dbUsers.find((u) => u.username === username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 2. 生成 JWT token
    const payload: UserEntity = {
      userId: user.userId,
      username: user.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }

  /**
   * 根据 userId 查找用户（用于 JWT 验证后的二次检查）
   * 供 JwtStrategy 调用
   */
  findUserById(userId: number): UserEntity | null {
    const user = dbUsers.find((u) => u.userId === userId);
    return user || null;
  }

  /**
   * 检查用户是否被禁用（示例）
   * 供 JwtStrategy 调用
   */
  isUserActive(userId: number): boolean {
    // 这里可以查询数据库检查用户状态
    // 示例：SELECT is_active FROM users WHERE id = userId
    const user = dbUsers.find((u) => u.userId === userId);
    if (!user) {
      return false;
    }
    return true; // 简化处理，实际应该查数据库
  }
}

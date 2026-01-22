import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // 导入 AuthModule 以使用 AuthService 和 JwtStrategy
  providers: [SocketGateway],
})
export class SocketModule {}

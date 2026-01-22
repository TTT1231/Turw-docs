import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import type { UserEntity } from '../auth/types/userEntitty';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway(3001, {
  namespace: 'socket',
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
/**
 * 装饰器说明:
 * @SubscribeMessage: 监听客户端发送的消息
 * @MessageBody()：提取消息体（支持基本类型、对象、二进制）
 * @ConnectedSocket()：获取客户端连接实例（操作连接 / 广播）
 * @UseGuards()：应用守卫进行权限验证
 *
 * 重要提示：
 * ! APP_GUARD（全局守卫）不会自动应用到 WebSocket 的 @SubscribeMessage()
 * ! 必须在类级别或方法级别显式使用 @UseGuards() 装饰器
 * ! 但是这样每次发送事件都要验证，性能不好，因此需要在连接时验证一次，后面间隔一段时间再次验证
 *
 * 最佳实践：
 * 1. 在 handleConnection 中验证 token，验证失败直接断开
 * 2. 验证成功后将用户信息挂载到 socket.data.user
 */
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  //定时检测心跳
  private heartBeatTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  //启动定时心跳检查
  //定期验证jwt token是否过期、是否在数据库中、是否活跃用户...
  private startHeartBeatCheck(client: Socket) {
    const timer = setInterval(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async () => {
        await this.validateTokenAndUserAct(client);
      },
      1 * 60 * 1000,
    ); //每1分钟检查一次
    this.heartBeatTimers.set(client.id, timer);
  }

  //验证jwt token和检查用户是否存在和活跃
  private async validateTokenAndUserAct(client: Socket): Promise<boolean> {
    try {
      // 步骤1: 从 handshake 中提取 token
      const token = (client.handshake.auth?.token || client.handshake.query?.token) as string | null | undefined;

      if (!token) {
        throw new WsException('缺少认证 token');
      }

      //jwt 验证
      const payload = await this.jwtService.verifyAsync<UserEntity>(token);

      //is in db
      const user = this.authService.findUserById(payload.userId);
      if (!user) {
        throw new WsException('用户不存在');
      }
      // is active user
      const isActive = this.authService.isUserActive(payload.userId);
      if (!isActive) {
        throw new WsException('用户已被禁用');
      }

      // 步骤4: 将用户信息挂载到 socket.data，方便后续使用
      client.data.user = user;

      console.log(`✅ 已连接，Socket ID: ${client.id}`);
      return true;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error(`❌ 连接认证失败: ${error.message}`);

      // 发送错误信息给客户端
      client.emit('error', {
        message: '认证失败',
        code: 'UNAUTHORIZED',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        detail: error.message,
      });

      // 断开连接
      client.disconnect();
      return false;
    }
  }

  //socket连接时事件
  async handleConnection(client: Socket) {
    await this.validateTokenAndUserAct(client);
    this.startHeartBeatCheck(client);
  }

  //socket断开连接时事件
  handleDisconnect(client: Socket) {
    //清理定时器
    const timer = this.heartBeatTimers.get(client.id);
    if (timer) {
      clearInterval(timer);
      this.heartBeatTimers.delete(client.id);
    }

    const user = client.data.user as UserEntity | undefined;
    if (user) {
      console.log(`👋 用户 ${user.username} (ID: ${user.userId}) 已断开连接`);
    } else {
      console.log(`👋 匿名用户已断开连接，Socket ID: ${client.id}`);
    }
  }

  @SubscribeMessage('public-message')
  handlePublicMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    console.log(`📢 公开消息 from ${client.id}: ${data}`);
    return {
      event: 'public-message',
      data: `这是公开消息响应: ${data}`,
    };
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    // 从 socket.data 中获取用户信息（已在 handleConnection 中设置）
    //  const user = client.data.user as UserEntity;

    console.log(`💬 收到来自用户  的消息: ${data}`);

    return {
      event: 'message',
      data: `你好 ! 你发送了: ${data}`,
    };
  }

  @SubscribeMessage('private-message')
  handlePrivateMessage(
    @MessageBody() data: { targetUserId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as UserEntity | undefined;

    // 检查用户是否已认证
    if (!user) {
      console.log('❌ 未认证用户尝试发送私聊消息');
      return {
        event: 'private-message',
        data: {
          success: false,
          message: '请先进行身份认证',
        },
      };
    }

    console.log(`📨 用户 ${user.username} 发送私聊给用户 ${data.targetUserId}: ${data.content}`);

    // 这里可以查找目标用户的 socket 并发送消息
    //  userId -> socketId 的映射

    return {
      event: 'private-message',
      data: {
        success: true,
        message: '私聊消息已发送',
        from: user.username,
        to: data.targetUserId,
        content: data.content,
      },
    };
  }
}

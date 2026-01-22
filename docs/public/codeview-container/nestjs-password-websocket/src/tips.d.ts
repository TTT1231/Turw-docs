import type { UserEntity } from './auth/types/userEntitty';

declare module 'socket.io' {
  interface Socket {
    data: {
      user: UserEntity;
    };
  }
}

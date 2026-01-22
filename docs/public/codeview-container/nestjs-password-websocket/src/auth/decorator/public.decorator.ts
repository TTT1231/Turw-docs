import { SetMetadata } from '@nestjs/common';

export const AUTH_PUBLIC_HTTP_KEY = 'AUTH_PUBLIC_HTTP_KEY';
export const AuthHttpPublic = () => SetMetadata(AUTH_PUBLIC_HTTP_KEY, true);

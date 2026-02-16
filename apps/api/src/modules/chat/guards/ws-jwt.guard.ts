import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    if (client.data.userId) {
      return true;
    }

    const token = client.handshake.auth.token;
    if (!token) {
      throw new WsException('No token provided');
    }

    try {
      const payload = await this.jwtService.verify(token);
      client.data.userId = payload.sub;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}

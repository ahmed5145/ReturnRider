import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  verifyToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT not configured');
    }
    try {
      return jwt.verify(token, secret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getOrCreateUser(payload: JwtPayload) {
    let user = await this.prisma.user.findUnique({
      where: { externalAuthId: payload.sub },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          externalAuthId: payload.sub,
          email: payload.email,
        },
      });
    }
    return user;
  }

  /** Dev helper: issue token for testing */
  signDevToken(sub: string, email: string): string {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32';
    return jwt.sign({ sub, email }, secret, { expiresIn: '7d' });
  }
}

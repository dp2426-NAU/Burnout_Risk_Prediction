import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      return null;
    }

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.signAccessToken(payload),
      refreshToken: await this.signRefreshToken(payload),
      user: this.stripSensitiveFields(user),
    };
  }

  async register(dto: RegisterDto): Promise<User> {
    return this.usersService.create(dto);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.stripSensitiveFields(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async signAccessToken(payload: JwtPayload) {
    const expiresIn = this.configService.get<string | number>('JWT_ACCESS_EXPIRES', '900');
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn,
    });
  }

  private async signRefreshToken(payload: JwtPayload) {
    const expiresIn = this.configService.get<string | number>('JWT_REFRESH_EXPIRES', '604800');
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });
  }

  private stripSensitiveFields(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

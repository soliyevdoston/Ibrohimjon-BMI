import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { randomInt } from 'crypto';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class AuthService {
  private readonly otpTtlSeconds: number;
  private readonly otpRetryLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.otpTtlSeconds = Number(this.configService.get('OTP_TTL_SECONDS', 120));
    this.otpRetryLimit = Number(this.configService.get('OTP_RETRY_LIMIT', 5));
  }

  async requestOtp(phone: string, purpose: OtpPurpose, ipAddress?: string) {
    const latest = await this.prisma.otpCode.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (latest && dayjs().diff(latest.createdAt, 'second') < 30) {
      throw new HttpException('Please wait 30 seconds before requesting another OTP', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otpCode = String(randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(otpCode, 10);

    await this.prisma.otpCode.create({
      data: {
        phone,
        purpose,
        codeHash,
        ipAddress,
        expiresAt: dayjs().add(this.otpTtlSeconds, 'second').toDate(),
      },
    });

    return {
      sent: true,
      expiresInSeconds: this.otpTtlSeconds,
      devCode: process.env.NODE_ENV === 'production' ? undefined : otpCode,
    };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || dayjs(otp.expiresAt).isBefore(dayjs())) {
      throw new BadRequestException('OTP is expired or invalid');
    }

    if (otp.attemptCount >= this.otpRetryLimit) {
      throw new HttpException('Too many invalid attempts. Request a new OTP', HttpStatus.TOO_MANY_REQUESTS);
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP code');
    }

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: { isPhoneVerified: true },
      create: {
        phone,
        role: UserRole.CUSTOMER,
        isPhoneVerified: true,
      },
    });

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    return this.issueTokens(user.id, user.phone, user.role);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; phone: string; role: UserRole };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const isValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(payload.sub, payload.phone, payload.role);
  }

  private async issueTokens(userId: string, phone: string, role: UserRole) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, phone, role },
      {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TTL', '15m'),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, phone, role },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TTL', '30d'),
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: dayjs().add(30, 'day').toDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      user: {
        id: userId,
        phone,
        role,
      },
    };
  }
}

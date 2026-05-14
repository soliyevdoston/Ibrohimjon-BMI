import { Body, Controller, Ip, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.authService.requestOtp(dto.phone, dto.purpose, ip);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  @Post('email/login')
  loginEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto.email, dto.password);
  }

  @Post('email/register')
  registerEmail(@Body() dto: EmailRegisterDto) {
    return this.authService.registerWithEmail(dto.email, dto.password, dto.fullName, dto.role);
  }

  @Post('phone/login')
  loginPhone(@Body() dto: { phone: string; password: string }) {
    return this.authService.loginWithPhone(dto.phone, dto.password);
  }

  @Post('google')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}

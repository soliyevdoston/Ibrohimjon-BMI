import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SellersService } from './sellers.service';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('profile')
  profile(@CurrentUser('id') userId: string) {
    return this.sellersService.myProfile(userId);
  }

  @Post('profile')
  upsert(
    @CurrentUser('id') userId: string,
    @Body()
    payload: {
      legalName: string;
      brandName: string;
      description?: string;
      addressText?: string;
      addressLat?: number;
      addressLng?: number;
    },
  ) {
    return this.sellersService.upsertProfile(userId, payload);
  }
}

import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouriersService } from './couriers.service';

@Controller('courier')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COURIER)
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get('profile')
  profile(@CurrentUser('id') userId: string) {
    return this.couriersService.myProfile(userId);
  }

  @Post('profile')
  upsert(@CurrentUser('id') userId: string, @Body() body: { vehicleType?: string }) {
    return this.couriersService.upsertProfile(userId, body);
  }

  @Patch('presence')
  presence(
    @CurrentUser('id') userId: string,
    @Body() body: { isOnline: boolean; isAvailable: boolean },
  ) {
    return this.couriersService.setPresence(userId, body);
  }
}

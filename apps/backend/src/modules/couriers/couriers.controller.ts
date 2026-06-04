import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole, VehicleType } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouriersService } from './couriers.service';

@Controller('courier')
@UseGuards(JwtAuthGuard)
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  search(@Query('vehicleType') vehicleType?: string) {
    const vt = vehicleType as VehicleType | undefined;
    return this.couriersService.searchAvailable(vt);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  profile(@CurrentUser('id') userId: string) {
    return this.couriersService.myProfile(userId);
  }

  @Post('profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  upsert(@CurrentUser('id') userId: string, @Body() body: { vehicleType?: string }) {
    return this.couriersService.upsertProfile(userId, body);
  }

  @Patch('presence')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  presence(
    @CurrentUser('id') userId: string,
    @Body() body: { isOnline: boolean; isAvailable: boolean },
  ) {
    return this.couriersService.setPresence(userId, body);
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourierLocationDto } from './dto/courier-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { DeliveriesService } from './deliveries.service';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COURIER)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get('available')
  available(@CurrentUser('id') courierUserId: string) {
    return this.deliveriesService.listAvailable(courierUserId);
  }

  @Get('active')
  active(@CurrentUser('id') courierUserId: string) {
    return this.deliveriesService.myActiveDelivery(courierUserId);
  }

  @Post(':id/accept')
  accept(@Param('id') deliveryId: string, @CurrentUser('id') courierUserId: string) {
    return this.deliveriesService.acceptDelivery(deliveryId, courierUserId);
  }

  @Post(':id/reject')
  reject(@Param('id') deliveryId: string, @CurrentUser('id') courierUserId: string) {
    return this.deliveriesService.rejectDelivery(deliveryId, courierUserId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') deliveryId: string,
    @CurrentUser('id') courierUserId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveriesService.updateStatus(deliveryId, courierUserId, dto);
  }

  @Post(':id/location')
  location(
    @Param('id') deliveryId: string,
    @CurrentUser('id') courierUserId: string,
    @Body() dto: CourierLocationDto,
  ) {
    return this.deliveriesService.pushLocation(deliveryId, courierUserId, dto);
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  users() {
    return this.adminService.users();
  }

  @Get('sellers')
  sellers() {
    return this.adminService.sellers();
  }

  @Get('couriers')
  couriers() {
    return this.adminService.couriers();
  }

  @Get('orders')
  orders() {
    return this.adminService.orders();
  }

  @Post('orders/manual-assign')
  manualAssign(@Body() body: { orderId: string; courierId: string }) {
    return this.adminService.manualAssignCourier(body.orderId, body.courierId);
  }
}

import { Body, Controller, ForbiddenException, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { SeedService } from './seed.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seedService: SeedService,
  ) {}

  /**
   * One-shot demo seed. Protected by ADMIN_SEED_SECRET env var so it can
   * be safely exposed without role auth (used to bootstrap a fresh DB).
   * Idempotent: re-running upserts existing rows.
   *   curl -X POST -H "x-seed-secret: <SECRET>" \
   *     https://ibrohimjon-bmi.onrender.com/api/v1/admin/seed
   */
  @Post('seed')
  async seed(@Headers('x-seed-secret') secret: string) {
    const expected = process.env.ADMIN_SEED_SECRET || 'lochin-seed-2026';
    if (!secret || secret !== expected) {
      throw new ForbiddenException('Invalid seed secret');
    }
    return this.seedService.runFullSeed();
  }

  // Everything below requires admin auth.
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  users() {
    return this.adminService.users();
  }

  @Get('sellers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  sellers() {
    return this.adminService.sellers();
  }

  @Get('couriers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  couriers() {
    return this.adminService.couriers();
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  orders() {
    return this.adminService.orders();
  }

  @Post('orders/manual-assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  manualAssign(@Body() body: { orderId: string; courierId: string }) {
    return this.adminService.manualAssignCourier(body.orderId, body.courierId);
  }
}

import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole, VehicleType } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PricingService } from '../pricing/pricing.service';
import { AdminService } from './admin.service';
import { SeedService } from './seed.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seedService: SeedService,
    private readonly pricingService: PricingService,
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

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  stats() {
    return this.adminService.stats();
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

  @Post('sellers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createSeller(@Body() body: {
    email: string;
    password: string;
    fullName?: string;
    brandName: string;
    legalName: string;
    phone?: string;
    description?: string;
    addressText?: string;
    addressLat?: number;
    addressLng?: number;
  }) {
    return this.adminService.createSeller(body);
  }

  @Patch('sellers/:id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setSellerActive(@Param('id') sellerId: string, @Body() body: { isActive: boolean }) {
    return this.adminService.updateSellerActive(sellerId, !!body.isActive);
  }

  @Delete('sellers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteSeller(@Param('id') sellerId: string) {
    return this.adminService.deleteSeller(sellerId);
  }

  @Get('couriers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  couriers() {
    return this.adminService.couriers();
  }

  @Post('couriers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createCourier(@Body() body: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    vehicleType?: VehicleType;
    vehicleModel?: string;
    vehiclePlate?: string;
    maxLoadKg?: number;
  }) {
    return this.adminService.createCourier(body);
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

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getConfig() {
    return this.pricingService.getConfig();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateConfig(@Body() body: Record<string, number>) {
    const data: Record<string, number> = {};
    const allowed = [
      'commissionRate', 'serviceFeeRate',
      'deliveryBaseFee', 'deliveryPerKmFee', 'courierBaseFee', 'courierPerKmFee',
      'carBaseFee', 'carPerKmFee', 'carCourierBase', 'carCourierPerKm',
      'vanBaseFee', 'vanPerKmFee', 'vanCourierBase', 'vanCourierPerKm',
      'truckBaseFee', 'truckPerKmFee', 'truckCourierBase', 'truckCourierPerKm',
      'bikeMaxKg', 'carMaxKg', 'vanMaxKg', 'freeDeliveryAbove',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = Number(body[key]);
    }
    return this.pricingService.updateConfig(data);
  }
}

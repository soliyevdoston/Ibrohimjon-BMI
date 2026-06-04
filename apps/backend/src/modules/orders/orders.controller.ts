import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PricingService } from '../pricing/pricing.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SellerUpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pricingService: PricingService,
  ) {}

  @Get('quote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async quote(
    @Query('subtotal') subtotal: string,
    @Query('distanceKm') distanceKm?: string,
    @Query('weightKg') weightKg?: string,
    @Query('vehicleHint') vehicleHint?: 'BIKE' | 'CAR' | 'VAN' | 'TRUCK',
    @Query('sellerId') sellerId?: string,
    @Query('deliveryLat') deliveryLat?: string,
    @Query('deliveryLng') deliveryLng?: string,
  ) {
    return this.ordersService.computeQuote({
      subtotal: Number(subtotal) || 0,
      distanceKm: distanceKm !== undefined ? Number(distanceKm) : undefined,
      totalWeightKg: weightKg !== undefined ? Number(weightKg) : 0,
      vehicleHint: vehicleHint,
      sellerId,
      deliveryLat: deliveryLat !== undefined ? Number(deliveryLat) : undefined,
      deliveryLng: deliveryLng !== undefined ? Number(deliveryLng) : undefined,
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(@CurrentUser('id') customerId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(customerId, dto);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  myOrders(@CurrentUser('id') customerId: string) {
    return this.ordersService.myOrders(customerId);
  }

  @Get('seller')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerOrders(@CurrentUser('id') sellerUserId: string) {
    return this.ordersService.sellerOrders(sellerUserId);
  }

  @Get('seller/dashboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerDashboard(@CurrentUser('id') sellerUserId: string) {
    return this.ordersService.dashboardForSeller(sellerUserId);
  }

  @Patch(':id/seller-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerUpdateStatus(
    @Param('id') orderId: string,
    @CurrentUser('id') sellerUserId: string,
    @Body() dto: SellerUpdateOrderStatusDto,
  ) {
    return this.ordersService.sellerUpdateOrderStatus(orderId, sellerUserId, dto);
  }

  @Post(':id/call-courier')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  callCourier(@Param('id') orderId: string, @CurrentUser('id') sellerUserId: string) {
    return this.ordersService.callCourier(orderId, sellerUserId);
  }

  @Get(':id')
  detail(
    @Param('id') orderId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.ordersService.detail(orderId, userId, role);
  }
}

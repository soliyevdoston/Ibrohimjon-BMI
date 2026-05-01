import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayoutPayeeType, PayoutStatus, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PricingService } from '../pricing/pricing.service';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(
    private readonly payouts: PayoutsService,
    private readonly pricing: PricingService,
  ) {}

  // ---- Seller ----
  @Get('seller/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerSummary(@CurrentUser('id') userId: string) {
    return this.payouts.sellerSummary(userId);
  }

  @Get('seller/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerHistory(@CurrentUser('id') userId: string) {
    return this.payouts.sellerHistory(userId);
  }

  @Get('seller/ledger')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerLedger(@CurrentUser('id') userId: string) {
    return this.payouts.sellerLedger(userId);
  }

  @Post('seller/request')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerRequest(
    @CurrentUser('id') userId: string,
    @Body() body: { amount?: number },
  ) {
    return this.payouts.sellerRequest(userId, body?.amount);
  }

  @Put('seller/bank')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  sellerUpdateBank(
    @CurrentUser('id') userId: string,
    @Body() body: { bankCardNumber?: string | null; bankCardHolder?: string | null },
  ) {
    return this.payouts.sellerUpdateBank(userId, body);
  }

  // ---- Courier ----
  @Get('courier/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  courierSummary(@CurrentUser('id') userId: string) {
    return this.payouts.courierSummary(userId);
  }

  @Get('courier/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  courierHistory(@CurrentUser('id') userId: string) {
    return this.payouts.courierHistory(userId);
  }

  @Get('courier/ledger')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  courierLedger(@CurrentUser('id') userId: string) {
    return this.payouts.courierLedger(userId);
  }

  @Post('courier/request')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  courierRequest(
    @CurrentUser('id') userId: string,
    @Body() body: { amount?: number },
  ) {
    return this.payouts.courierRequest(userId, body?.amount);
  }

  @Put('courier/bank')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COURIER)
  courierUpdateBank(
    @CurrentUser('id') userId: string,
    @Body() body: { bankCardNumber?: string | null; bankCardHolder?: string | null },
  ) {
    return this.payouts.courierUpdateBank(userId, body);
  }

  // ---- Admin ----
  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminOverview() {
    return this.payouts.adminFinancialOverview();
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminList(
    @Query('status') status?: PayoutStatus,
    @Query('payeeType') payeeType?: PayoutPayeeType,
  ) {
    return this.payouts.adminListPayouts({ status, payeeType });
  }

  @Get('admin/sellers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSellers() {
    return this.payouts.adminListSellersWithBalance();
  }

  @Patch('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminApprove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.payouts.adminApprove(id, adminId);
  }

  @Patch('admin/:id/paid')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminMarkPaid(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.payouts.adminMarkPaid(id, adminId);
  }

  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminReject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason?: string },
  ) {
    return this.payouts.adminReject(id, adminId, body?.reason);
  }

  @Patch('admin/sellers/:id/commission')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSetCommission(
    @Param('id') sellerId: string,
    @Body() body: { commissionRate: number },
  ) {
    return this.payouts.adminSetSellerCommission(sellerId, body.commissionRate);
  }

  // ---- Platform config (admin) ----
  @Get('admin/config')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getConfig() {
    return this.pricing.getConfig();
  }

  @Put('admin/config')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateConfig(
    @Body()
    body: {
      commissionRate?: number;
      serviceFeeRate?: number;
      deliveryBaseFee?: number;
      deliveryPerKmFee?: number;
      courierBaseFee?: number;
      courierPerKmFee?: number;
    },
  ) {
    return this.pricing.updateConfig(body);
  }
}

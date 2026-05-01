import { Injectable } from '@nestjs/common';
import { PlatformConfig, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';

export interface PricingBreakdown {
  subtotalAmount: number;
  deliveryFeeAmount: number;
  serviceFeeAmount: number;
  totalAmount: number;
  platformCommissionAmount: number;
  courierFeeAmount: number;
  sellerPayoutAmount: number;
  platformRevenueAmount: number;
  commissionRateSnapshot: number;
  distanceKm: number;
}

export interface ComputeBreakdownInput {
  subtotal: number;
  distanceKm: number;
  sellerCommissionRate?: number;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Reads platform config; creates a default singleton row on first call. */
  async getConfig(): Promise<PlatformConfig> {
    const existing = await this.prisma.platformConfig.findUnique({
      where: { id: 'default' },
    });
    if (existing) return existing;
    return this.prisma.platformConfig.create({ data: { id: 'default' } });
  }

  async updateConfig(data: Prisma.PlatformConfigUpdateInput) {
    await this.getConfig();
    return this.prisma.platformConfig.update({ where: { id: 'default' }, data });
  }

  async computeBreakdown(input: ComputeBreakdownInput): Promise<PricingBreakdown> {
    const cfg = await this.getConfig();
    return this.computeBreakdownWithConfig(input, cfg);
  }

  computeBreakdownWithConfig(
    input: ComputeBreakdownInput,
    cfg: PlatformConfig,
  ): PricingBreakdown {
    const subtotal = round(input.subtotal);
    const distanceKm = Math.max(0, Number(input.distanceKm) || 0);

    const deliveryBase = num(cfg.deliveryBaseFee);
    const deliveryPerKm = num(cfg.deliveryPerKmFee);
    const courierBase = num(cfg.courierBaseFee);
    const courierPerKm = num(cfg.courierPerKmFee);
    const platformCommissionRate = num(cfg.commissionRate);
    const serviceFeeRate = num(cfg.serviceFeeRate);

    const commissionRate =
      input.sellerCommissionRate !== undefined
        ? input.sellerCommissionRate
        : platformCommissionRate;

    const deliveryFee = round(deliveryBase + distanceKm * deliveryPerKm);
    const courierFee = round(courierBase + distanceKm * courierPerKm);
    const serviceFee = round(subtotal * serviceFeeRate);
    const total = subtotal + deliveryFee + serviceFee;

    const platformCommission = round(subtotal * commissionRate);
    const sellerPayout = subtotal - platformCommission;
    const deliveryMargin = deliveryFee - courierFee;
    const platformRevenue = platformCommission + deliveryMargin + serviceFee;

    return {
      subtotalAmount: subtotal,
      deliveryFeeAmount: deliveryFee,
      serviceFeeAmount: serviceFee,
      totalAmount: total,
      platformCommissionAmount: platformCommission,
      courierFeeAmount: courierFee,
      sellerPayoutAmount: sellerPayout,
      platformRevenueAmount: platformRevenue,
      commissionRateSnapshot: commissionRate,
      distanceKm,
    };
  }
}

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function round(value: number): number {
  return Math.round(value);
}

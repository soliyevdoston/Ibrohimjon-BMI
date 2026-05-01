import { Injectable } from '@nestjs/common';
import { PlatformConfig, Prisma, VehicleType } from '@prisma/client';
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
  totalWeightKg: number;
  requiredVehicle: VehicleType;
  freeDeliveryAbove: number;
  isFreeDelivery: boolean;
}

export interface ComputeBreakdownInput {
  subtotal: number;
  distanceKm: number;
  totalWeightKg?: number;
  /** If any line item explicitly demands a higher-tier vehicle. */
  vehicleHint?: VehicleType;
  sellerCommissionRate?: number;
}

const VEHICLE_RANK: Record<VehicleType, number> = {
  BIKE: 0,
  CAR: 1,
  VAN: 2,
  TRUCK: 3,
};

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

  /** Pick the smallest vehicle that can carry the given weight. */
  pickVehicle(weightKg: number, cfg: PlatformConfig, hint?: VehicleType): VehicleType {
    const w = Math.max(0, weightKg);
    let byWeight: VehicleType;
    if (w <= num(cfg.bikeMaxKg)) byWeight = VehicleType.BIKE;
    else if (w <= num(cfg.carMaxKg)) byWeight = VehicleType.CAR;
    else if (w <= num(cfg.vanMaxKg)) byWeight = VehicleType.VAN;
    else byWeight = VehicleType.TRUCK;

    if (!hint) return byWeight;
    return VEHICLE_RANK[hint] >= VEHICLE_RANK[byWeight] ? hint : byWeight;
  }

  computeBreakdownWithConfig(
    input: ComputeBreakdownInput,
    cfg: PlatformConfig,
  ): PricingBreakdown {
    const subtotal = round(input.subtotal);
    const distanceKm = Math.max(0, Number(input.distanceKm) || 0);
    const totalWeightKg = Math.max(0, Number(input.totalWeightKg ?? 0));

    const requiredVehicle = this.pickVehicle(totalWeightKg, cfg, input.vehicleHint);
    const tier = this.tierRates(requiredVehicle, cfg);

    const platformCommissionRate = num(cfg.commissionRate);
    const serviceFeeRate = num(cfg.serviceFeeRate);

    const commissionRate =
      input.sellerCommissionRate !== undefined
        ? input.sellerCommissionRate
        : platformCommissionRate;

    const rawDeliveryFee = round(tier.deliveryBase + distanceKm * tier.deliveryPerKm);
    const freeDeliveryAbove = num(cfg.freeDeliveryAbove);
    const isFreeDelivery = freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove;
    const deliveryFee = isFreeDelivery ? 0 : rawDeliveryFee;
    const courierFee = round(tier.courierBase + distanceKm * tier.courierPerKm);
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
      totalWeightKg,
      requiredVehicle,
      freeDeliveryAbove,
      isFreeDelivery,
    };
  }

  private tierRates(v: VehicleType, cfg: PlatformConfig) {
    switch (v) {
      case VehicleType.TRUCK:
        return {
          deliveryBase: num(cfg.truckBaseFee),
          deliveryPerKm: num(cfg.truckPerKmFee),
          courierBase: num(cfg.truckCourierBase),
          courierPerKm: num(cfg.truckCourierPerKm),
        };
      case VehicleType.VAN:
        return {
          deliveryBase: num(cfg.vanBaseFee),
          deliveryPerKm: num(cfg.vanPerKmFee),
          courierBase: num(cfg.vanCourierBase),
          courierPerKm: num(cfg.vanCourierPerKm),
        };
      case VehicleType.CAR:
        return {
          deliveryBase: num(cfg.carBaseFee),
          deliveryPerKm: num(cfg.carPerKmFee),
          courierBase: num(cfg.carCourierBase),
          courierPerKm: num(cfg.carCourierPerKm),
        };
      case VehicleType.BIKE:
      default:
        return {
          deliveryBase: num(cfg.deliveryBaseFee),
          deliveryPerKm: num(cfg.deliveryPerKmFee),
          courierBase: num(cfg.courierBaseFee),
          courierPerKm: num(cfg.courierPerKmFee),
        };
    }
  }
}

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function round(value: number): number {
  return Math.round(value);
}

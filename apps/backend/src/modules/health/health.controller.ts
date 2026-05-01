import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { PricingService } from '../pricing/pricing.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  @Get()
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('config')
  async publicConfig() {
    const cfg = await this.pricingService.getConfig();
    return {
      freeDeliveryAbove: Number(cfg.freeDeliveryAbove),
      deliveryBaseFee: Number(cfg.deliveryBaseFee),
      deliveryPerKmFee: Number(cfg.deliveryPerKmFee),
      serviceFeeRate: Number(cfg.serviceFeeRate),
    };
  }
}

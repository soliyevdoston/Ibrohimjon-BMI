import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { LedgerService } from '../payouts/ledger.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly ledgerService: LedgerService,
  ) {}

  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  sellers() {
    return this.prisma.seller.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  couriers() {
    return this.prisma.courier.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  orders() {
    return this.prisma.order.findMany({
      include: { items: true, delivery: true, payment: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async manualAssignCourier(orderId: string, courierId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { orderId } });
    if (!delivery) {
      throw new NotFoundException('Delivery record not found for order');
    }

    const courier = await this.prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.delivery.update({
        where: { orderId },
        data: {
          courierId,
          status: DeliveryStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: { order: true },
      });

      // Skip if a courier ledger entry was already created (e.g. courier had
      // accepted then admin reassigned). Otherwise create one for this courier.
      const existing = await tx.ledgerEntry.findFirst({
        where: { orderId, type: 'COURIER_FEE' },
      });
      if (!existing) {
        await this.ledgerService.createCourierEntry(tx, {
          orderId,
          courierId,
          amount: Number(next.order.courierFeeAmount),
        });
      }

      return next;
    });

    this.realtimeService.publishDeliveryStatus(updated.id, updated.status, { orderId, courierId });
    this.realtimeService.publishOrderStatus(orderId, 'COURIER_ACCEPTED', { courierId });

    return updated;
  }

  async dashboard() {
    const activeDeliveries = await this.prisma.delivery.count({
      where: { status: { in: ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'] } },
    });

    const activeOrders = await this.prisma.order.count({
      where: {
        status: {
          in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'],
        },
      },
    });

    return {
      activeOrders,
      activeDeliveries,
      dbConnection: 'healthy',
      wsGateway: 'healthy',
      generatedAt: new Date().toISOString(),
    };
  }
}

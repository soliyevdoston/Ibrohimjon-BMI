import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
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

    const updated = await this.prisma.delivery.update({
      where: { orderId },
      data: {
        courierId,
        status: DeliveryStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: { order: true },
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

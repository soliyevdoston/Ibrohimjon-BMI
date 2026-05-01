import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, OrderStatus, PaymentStatus, VehicleType } from '@prisma/client';

const VEHICLE_RANK: Record<VehicleType, number> = {
  BIKE: 0,
  CAR: 1,
  VAN: 2,
  TRUCK: 3,
};

function vehiclesAtOrBelow(my: VehicleType): VehicleType[] {
  const myRank = VEHICLE_RANK[my];
  return Object.values(VehicleType).filter((v) => VEHICLE_RANK[v] <= myRank);
}
import dayjs from 'dayjs';
import { PrismaService } from 'src/common/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { LedgerService } from '../payouts/ledger.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CourierLocationDto } from './dto/courier-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly realtimeService: RealtimeService,
    private readonly ledgerService: LedgerService,
  ) {}

  async listAvailable(courierUserId: string) {
    const courier = await this.ensureCourierProfile(courierUserId);
    const acceptableVehicles = vehiclesAtOrBelow(courier.vehicleType);

    return this.prisma.delivery.findMany({
      where: {
        status: DeliveryStatus.SEARCHING_COURIER,
        order: {
          requiredVehicle: { in: acceptableVehicles },
        },
      },
      include: {
        order: {
          include: {
            items: true,
            seller: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  async acceptDelivery(deliveryId: string, courierUserId: string) {
    const courier = await this.ensureCourierProfile(courierUserId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.SEARCHING_COURIER) {
      throw new BadRequestException('Delivery already taken');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.delivery.updateMany({
        where: {
          id: deliveryId,
          status: DeliveryStatus.SEARCHING_COURIER,
        },
        data: {
          courierId: courier.id,
          status: DeliveryStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        throw new BadRequestException('Delivery already taken by another courier');
      }

      const fresh = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true },
      });

      if (!fresh) {
        throw new NotFoundException('Delivery not found after assignment');
      }

      // Create the courier-fee ledger entry now that we know who's earning it.
      await this.ledgerService.createCourierEntry(tx, {
        orderId: fresh.orderId,
        courierId: courier.id,
        amount: Number(fresh.order.courierFeeAmount),
      });

      return fresh;
    });

    await this.ordersService.markDeliveryStatus(updated.orderId, OrderStatus.COURIER_ACCEPTED, courierUserId);

    this.realtimeService.publishDeliveryStatus(deliveryId, DeliveryStatus.ACCEPTED, {
      orderId: updated.orderId,
      courierId: courier.id,
    });

    // Tell other couriers this delivery is no longer pickable.
    this.realtimeService.notifyDeliveryClaimed(deliveryId, courier.id);

    // Tell the seller a courier is on the way.
    this.realtimeService.notifySellerOrderUpdate(
      updated.order.sellerId,
      updated.orderId,
      OrderStatus.COURIER_ACCEPTED,
    );

    return updated;
  }

  async rejectDelivery(deliveryId: string, courierUserId: string) {
    await this.ensureCourierProfile(courierUserId);

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.SEARCHING_COURIER) {
      throw new BadRequestException('Cannot reject active delivery');
    }

    return { rejected: true, deliveryId };
  }

  async myActiveDelivery(courierUserId: string) {
    const courier = await this.ensureCourierProfile(courierUserId);
    return this.prisma.delivery.findFirst({
      where: {
        courierId: courier.id,
        status: {
          in: [DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP, DeliveryStatus.ON_THE_WAY],
        },
      },
      include: { order: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateStatus(deliveryId: string, courierUserId: string, dto: UpdateDeliveryStatusDto) {
    const courier = await this.ensureCourierProfile(courierUserId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.courierId !== courier.id) {
      throw new ForbiddenException('Delivery is assigned to another courier');
    }

    const transitionMap: Record<string, string[]> = {
      ACCEPTED: ['PICKED_UP'],
      PICKED_UP: ['ON_THE_WAY'],
      ON_THE_WAY: ['DELIVERED'],
    };

    if (!transitionMap[delivery.status]?.includes(dto.status)) {
      throw new BadRequestException('Invalid delivery transition');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: dto.status as DeliveryStatus,
          pickedUpAt: dto.status === 'PICKED_UP' ? new Date() : undefined,
          deliveredAt: dto.status === 'DELIVERED' ? new Date() : undefined,
        },
      });

      if (dto.status === 'DELIVERED') {
        const order = await tx.order.findUnique({
          where: { id: next.orderId },
          select: { paymentStatus: true, paymentMethod: true },
        });

        // Cash on delivery: courier collects cash, so the platform receives
        // the full amount as soon as delivery is confirmed. Mark order PAID
        // and flip the seller/commission/service-fee entries that the gateway
        // callback would normally have flipped at /payments/callback time.
        if (order && order.paymentStatus !== PaymentStatus.PAID) {
          await tx.order.update({
            where: { id: next.orderId },
            data: { paymentStatus: PaymentStatus.PAID, deliveredAt: new Date() },
          });
          await this.ledgerService.markPaidSettlements(tx, next.orderId);
        } else {
          await tx.order.update({
            where: { id: next.orderId },
            data: { deliveredAt: new Date() },
          });
        }

        // Always flip courier-fee + delivery-margin on DELIVERED.
        await this.ledgerService.markDeliveredSettlements(tx, next.orderId, true);
      }

      return next;
    });

    const orderStatusMap: Record<string, OrderStatus> = {
      PICKED_UP: OrderStatus.PICKED_UP,
      ON_THE_WAY: OrderStatus.ON_THE_WAY,
      DELIVERED: OrderStatus.DELIVERED,
    };
    await this.ordersService.markDeliveryStatus(updated.orderId, orderStatusMap[dto.status], courierUserId);

    this.realtimeService.publishDeliveryStatus(deliveryId, updated.status, {
      orderId: updated.orderId,
      courierId: courier.id,
    });

    // Refresh seller dashboard at every transition so they can track the order.
    const orderForSeller = await this.prisma.order.findUnique({
      where: { id: updated.orderId },
      select: { sellerId: true },
    });
    if (orderForSeller) {
      this.realtimeService.notifySellerOrderUpdate(
        orderForSeller.sellerId,
        updated.orderId,
        orderStatusMap[dto.status],
      );
    }

    return updated;
  }

  async pushLocation(deliveryId: string, courierUserId: string, dto: CourierLocationDto) {
    const courier = await this.ensureCourierProfile(courierUserId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.courierId !== courier.id) {
      throw new ForbiddenException('Delivery is assigned to another courier');
    }

    const lastPoint = await this.prisma.courierLocation.findFirst({
      where: { deliveryId },
      orderBy: { capturedAt: 'desc' },
    });

    if (lastPoint && dayjs().diff(lastPoint.capturedAt, 'second') < 3) {
      return {
        accepted: true,
        throttled: true,
      };
    }

    const saved = await this.prisma.courierLocation.create({
      data: {
        courierId: courier.id,
        deliveryId,
        lat: dto.lat,
        lng: dto.lng,
        speedMps: dto.speedMps,
        headingDeg: dto.headingDeg,
      },
    });

    await this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        currentLat: dto.lat,
        currentLng: dto.lng,
        lastSeenAt: new Date(),
      },
    });

    this.realtimeService.publishCourierLocation(deliveryId, {
      lat: dto.lat,
      lng: dto.lng,
      speedMps: dto.speedMps,
      headingDeg: dto.headingDeg,
    });

    return {
      accepted: true,
      throttled: false,
      pointId: saved.id,
    };
  }

  private async ensureCourierProfile(courierUserId: string) {
    const courier = await this.prisma.courier.findFirst({ where: { userId: courierUserId } });
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }
    return courier;
  }
}

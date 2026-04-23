import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from 'src/common/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CourierLocationDto } from './dto/courier-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async listAvailable(courierUserId: string) {
    await this.ensureCourierProfile(courierUserId);

    return this.prisma.delivery.findMany({
      where: { status: DeliveryStatus.SEARCHING_COURIER },
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

    const claim = await this.prisma.delivery.updateMany({
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

    const updated = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!updated) {
      throw new NotFoundException('Delivery not found after assignment');
    }

    await this.ordersService.markDeliveryStatus(updated.orderId, OrderStatus.COURIER_ACCEPTED, courierUserId);

    this.realtimeService.publishDeliveryStatus(deliveryId, DeliveryStatus.ACCEPTED, {
      orderId: updated.orderId,
      courierId: courier.id,
    });

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

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: dto.status as DeliveryStatus,
        pickedUpAt: dto.status === 'PICKED_UP' ? new Date() : undefined,
        deliveredAt: dto.status === 'DELIVERED' ? new Date() : undefined,
      },
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

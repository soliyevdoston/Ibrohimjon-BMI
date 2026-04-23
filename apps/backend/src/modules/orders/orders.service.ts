import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, OrderStatus, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma.service';
import { haversineKm } from 'src/common/utils/haversine';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SellerUpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly baseFee: number;
  private readonly perKmFee: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
  ) {
    this.baseFee = Number(this.configService.get('DELIVERY_BASE_FEE', 6000));
    this.perKmFee = Number(this.configService.get('DELIVERY_PER_KM_FEE', 1400));
  }

  async create(customerId: string, dto: CreateOrderDto) {
    const existing = await this.prisma.order.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) {
      return existing;
    }

    const seller = await this.prisma.seller.findUnique({ where: { id: dto.sellerId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        sellerId: dto.sellerId,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products are unavailable');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException('Invalid product item');
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`${product.title} is out of stock`);
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        totalPrice: Number(product.price) * item.quantity,
        titleSnapshot: product.title,
      };
    });

    const subtotal = orderItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const distanceKm = haversineKm(
      Number(seller.addressLat ?? dto.deliveryLat),
      Number(seller.addressLng ?? dto.deliveryLng),
      dto.deliveryLat,
      dto.deliveryLng,
    );
    const deliveryFee = this.baseFee + distanceKm * this.perKmFee;
    const total = subtotal + deliveryFee;

    return this.prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new BadRequestException('Stock changed. Please refresh your cart');
        }
      }

      const order = await tx.order.create({
        data: {
          customerId,
          sellerId: dto.sellerId,
          idempotencyKey: dto.idempotencyKey,
          subtotalAmount: subtotal,
          deliveryFeeAmount: deliveryFee,
          totalAmount: total,
          paymentMethod: dto.paymentMethod,
          note: dto.note,
          deliveryAddressText: dto.deliveryAddressText,
          deliveryLat: dto.deliveryLat,
          deliveryLng: dto.deliveryLng,
          status: OrderStatus.PENDING,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              titleSnapshot: item.titleSnapshot,
              priceSnapshot: item.unitPrice,
              totalAmount: item.totalPrice,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              actorUserId: customerId,
              note: 'Order placed by customer',
            },
          },
        },
        include: {
          items: true,
          delivery: true,
          payment: true,
        },
      });

      this.realtimeService.publishOrderStatus(order.id, order.status);
      return order;
    });
  }

  async myOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        delivery: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sellerOrders(sellerUserId: string) {
    const seller = await this.prisma.seller.findFirst({ where: { userId: sellerUserId } });
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.prisma.order.findMany({
      where: { sellerId: seller.id },
      include: { items: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sellerUpdateOrderStatus(
    orderId: string,
    sellerUserId: string,
    dto: SellerUpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.seller.userId !== sellerUserId) {
      throw new ForbiddenException('Order does not belong to your store');
    }

    const allowedTransition: Record<string, string[]> = {
      PENDING: ['ACCEPTED'],
      ACCEPTED: ['PREPARING'],
      PREPARING: ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: [],
    };

    if (!allowedTransition[order.status]?.includes(dto.status)) {
      throw new BadRequestException('Invalid order status transition');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status as OrderStatus,
        statusChangedAt: new Date(),
        statusHistory: {
          create: {
            status: dto.status as OrderStatus,
            actorUserId: sellerUserId,
            note: dto.note,
          },
        },
      },
      include: { delivery: true },
    });

    if (dto.status === 'READY_FOR_PICKUP' && !updated.delivery) {
      await this.prisma.delivery.create({
        data: {
          orderId,
          status: DeliveryStatus.SEARCHING_COURIER,
        },
      });
    }

    this.realtimeService.publishOrderStatus(orderId, dto.status);

    return updated;
  }

  async callCourier(orderId: string, sellerUserId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { seller: true } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.seller.userId !== sellerUserId) {
      throw new ForbiddenException('Order does not belong to your store');
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Order must be ready for pickup before courier dispatch');
    }

    const delivery = await this.prisma.delivery.upsert({
      where: { orderId: order.id },
      update: { status: DeliveryStatus.SEARCHING_COURIER },
      create: {
        orderId: order.id,
        status: DeliveryStatus.SEARCHING_COURIER,
      },
    });

    this.realtimeService.publishDeliveryStatus(delivery.id, delivery.status, { orderId: order.id });

    return delivery;
  }

  async detail(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        delivery: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isOwner =
      role === 'ADMIN' ||
      order.customerId === userId ||
      Boolean(
        await this.prisma.seller.findFirst({
          where: {
            id: order.sellerId,
            userId,
          },
        }),
      );

    if (!isOwner) {
      throw new ForbiddenException('No access to this order');
    }

    return order;
  }

  async markDeliveryStatus(orderId: string, status: OrderStatus, actorUserId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusChangedAt: new Date(),
        statusHistory: {
          create: {
            status,
            actorUserId,
          },
        },
      },
    });

    this.realtimeService.publishOrderStatus(orderId, status);
    return order;
  }

  async dashboardForSeller(sellerUserId: string) {
    const seller = await this.prisma.seller.findFirst({ where: { userId: sellerUserId } });
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, activeOrders, revenueAgg] = await this.prisma.$transaction([
      this.prisma.order.count({
        where: {
          sellerId: seller.id,
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.order.count({
        where: {
          sellerId: seller.id,
          status: {
            in: ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COURIER_ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'],
          },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          sellerId: seller.id,
          status: {
            in: ['DELIVERED'],
          },
          createdAt: {
            gte: todayStart,
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      todayOrders,
      activeOrders,
      todayRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    };
  }
}

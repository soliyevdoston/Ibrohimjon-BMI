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
    this.realtimeService.notifyDeliveryClaimed(updated.id, courierId);
    this.realtimeService.notifySellerOrderUpdate(updated.order.sellerId, orderId, 'COURIER_ACCEPTED');

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

  async stats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const last7Start = new Date(todayStart);
    last7Start.setDate(last7Start.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueTodayAgg,
      revenueYesterdayAgg,
      revenueMonthAgg,
      ordersToday,
      ordersYesterday,
      activeDeliveries,
      activeDeliveriesYesterday,
      onlineCouriers,
      busyCouriers,
      totalCouriers,
      totalSellers,
      totalCustomers,
      totalProducts,
      totalOrders,
      avgDelivery,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: todayStart }, status: { not: 'CANCELED' } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: yesterdayStart, lt: todayStart }, status: { not: 'CANCELED' } },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: monthStart }, status: { not: 'CANCELED' } },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      this.prisma.delivery.count({
        where: { status: { in: ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'] } },
      }),
      this.prisma.delivery.count({
        where: {
          status: { in: ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'] },
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      this.prisma.courier.count({ where: { isOnline: true } }),
      this.prisma.courier.count({ where: { isOnline: true, isAvailable: false } }),
      this.prisma.courier.count(),
      this.prisma.seller.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.delivery.findMany({
        where: { deliveredAt: { not: null }, acceptedAt: { not: null } },
        select: { acceptedAt: true, deliveredAt: true },
        take: 200,
        orderBy: { deliveredAt: 'desc' },
      }),
    ]);

    const revenueToday = Number(revenueTodayAgg._sum.totalAmount ?? 0);
    const revenueYesterday = Number(revenueYesterdayAgg._sum.totalAmount ?? 0);
    const revenueMonth = Number(revenueMonthAgg._sum.totalAmount ?? 0);

    const pctDelta = (curr: number, prev: number) =>
      prev === 0 ? (curr === 0 ? 0 : 100) : Math.round(((curr - prev) / prev) * 1000) / 10;

    // Hourly revenue today (09:00 – 20:00 buckets)
    const todayOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: todayStart }, status: { not: 'CANCELED' } },
      select: { totalAmount: true, createdAt: true, status: true },
    });
    const hourBuckets = new Map<string, number>();
    for (let h = 9; h <= 20; h++) hourBuckets.set(String(h).padStart(2, '0'), 0);
    for (const o of todayOrders) {
      const h = String(o.createdAt.getHours()).padStart(2, '0');
      if (hourBuckets.has(h)) {
        hourBuckets.set(h, (hourBuckets.get(h) ?? 0) + Number(o.totalAmount));
      }
    }
    const revenueByHour = Array.from(hourBuckets.entries()).map(([h, v]) => ({ h, v }));

    // Status distribution (last 24h)
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const statusGroups = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: last24 } },
      _count: { _all: true },
    });
    const statusDistribution = statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    // Top sellers by revenue today
    const sellerRevenue = await this.prisma.order.groupBy({
      by: ['sellerId'],
      where: { createdAt: { gte: todayStart }, status: { not: 'CANCELED' } },
      _sum: { totalAmount: true },
      _count: { _all: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });
    const sellerIds = sellerRevenue.map((s) => s.sellerId);
    const sellers = sellerIds.length
      ? await this.prisma.seller.findMany({
          where: { id: { in: sellerIds } },
          include: { user: { select: { fullName: true, email: true } } },
        })
      : [];
    const sellerById = new Map(sellers.map((s) => [s.id, s]));
    const topSellers = sellerRevenue.map((r) => {
      const seller = sellerById.get(r.sellerId);
      return {
        id: r.sellerId,
        brand: seller?.brandName ?? '—',
        owner: seller?.user.fullName ?? seller?.user.email ?? '—',
        ordersToday: r._count._all,
        revenueToday: Number(r._sum.totalAmount ?? 0),
      };
    });

    // Last 7 days revenue
    const last7Orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: last7Start }, status: { not: 'CANCELED' } },
      select: { totalAmount: true, createdAt: true },
    });
    const dayBuckets = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, 0);
    }
    for (const o of last7Orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (dayBuckets.has(key)) {
        dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + Number(o.totalAmount));
      }
    }
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDay = Array.from(dayBuckets.entries()).map(([key, v]) => ({
      h: dayNames[new Date(key).getDay()],
      v,
    }));

    // Average delivery time (minutes), conversion-style placeholder
    const avgDeliveryMinutes = avgDelivery.length
      ? Math.round(
          avgDelivery.reduce(
            (sum, d) => sum + (d.deliveredAt!.getTime() - d.acceptedAt!.getTime()) / 60000,
            0,
          ) / avgDelivery.length,
        )
      : 0;

    return {
      kpis: {
        revenueToday,
        revenueDelta: pctDelta(revenueToday, revenueYesterday),
        ordersToday,
        ordersDelta: pctDelta(ordersToday, ordersYesterday),
        activeDeliveries,
        activeDelta: pctDelta(activeDeliveries, activeDeliveriesYesterday),
        onlineCouriers,
        busyCouriers,
        couriersDelta: 0,
      },
      totals: {
        couriers: totalCouriers,
        sellers: totalSellers,
        customers: totalCustomers,
        products: totalProducts,
        orders: totalOrders,
      },
      revenueByHour,
      revenueByDay,
      statusDistribution,
      topSellers,
      revenueMonth,
      avgDeliveryMinutes,
      generatedAt: now.toISOString(),
    };
  }
}

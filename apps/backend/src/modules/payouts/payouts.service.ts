import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerEntryStatus,
  LedgerPayeeType,
  PayoutPayeeType,
  PayoutStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { LedgerService } from './ledger.service';

type PayeeType = PayoutPayeeType;

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  // ---------- Seller -------------------------------------------------

  async sellerSummary(sellerUserId: string) {
    const seller = await this.requireSeller(sellerUserId);
    return this.summaryFor(PayoutPayeeType.SELLER, seller.id, {
      bankCardNumber: seller.bankCardNumber,
      bankCardHolder: seller.bankCardHolder,
      commissionRate: Number(seller.commissionRate),
    });
  }

  async sellerHistory(sellerUserId: string) {
    const seller = await this.requireSeller(sellerUserId);
    return this.historyFor(PayoutPayeeType.SELLER, seller.id);
  }

  async sellerLedger(sellerUserId: string) {
    const seller = await this.requireSeller(sellerUserId);
    return this.ledgerListFor(LedgerPayeeType.SELLER, seller.id);
  }

  async sellerRequest(sellerUserId: string, amount?: number) {
    const seller = await this.requireSeller(sellerUserId);
    if (!seller.bankCardNumber) {
      throw new BadRequestException(
        'Avval to`lov ma`lumotlarini (karta raqami) qo`shing',
      );
    }
    return this.requestPayout({
      payeeType: PayoutPayeeType.SELLER,
      ledgerPayeeType: LedgerPayeeType.SELLER,
      payeeId: seller.id,
      bankCardNumber: seller.bankCardNumber,
      bankCardHolder: seller.bankCardHolder,
      requestedAmount: amount,
    });
  }

  async sellerUpdateBank(
    sellerUserId: string,
    body: { bankCardNumber?: string | null; bankCardHolder?: string | null },
  ) {
    const seller = await this.requireSeller(sellerUserId);
    const cleaned = body.bankCardNumber
      ? body.bankCardNumber.replace(/\s+/g, '')
      : null;
    if (cleaned && !/^\d{12,19}$/.test(cleaned)) {
      throw new BadRequestException('Karta raqami noto`g`ri');
    }
    return this.prisma.seller.update({
      where: { id: seller.id },
      data: {
        bankCardNumber: cleaned,
        bankCardHolder: body.bankCardHolder?.trim() || null,
      },
      select: { bankCardNumber: true, bankCardHolder: true },
    });
  }

  // ---------- Courier ------------------------------------------------

  async courierSummary(courierUserId: string) {
    const courier = await this.requireCourier(courierUserId);
    return this.summaryFor(PayoutPayeeType.COURIER, courier.id, {
      bankCardNumber: courier.bankCardNumber,
      bankCardHolder: courier.bankCardHolder,
    });
  }

  async courierHistory(courierUserId: string) {
    const courier = await this.requireCourier(courierUserId);
    return this.historyFor(PayoutPayeeType.COURIER, courier.id);
  }

  async courierLedger(courierUserId: string) {
    const courier = await this.requireCourier(courierUserId);
    return this.ledgerListFor(LedgerPayeeType.COURIER, courier.id);
  }

  async courierRequest(courierUserId: string, amount?: number) {
    const courier = await this.requireCourier(courierUserId);
    if (!courier.bankCardNumber) {
      throw new BadRequestException(
        'Avval to`lov ma`lumotlarini (karta raqami) qo`shing',
      );
    }
    return this.requestPayout({
      payeeType: PayoutPayeeType.COURIER,
      ledgerPayeeType: LedgerPayeeType.COURIER,
      payeeId: courier.id,
      bankCardNumber: courier.bankCardNumber,
      bankCardHolder: courier.bankCardHolder,
      requestedAmount: amount,
    });
  }

  async courierUpdateBank(
    courierUserId: string,
    body: { bankCardNumber?: string | null; bankCardHolder?: string | null },
  ) {
    const courier = await this.requireCourier(courierUserId);
    const cleaned = body.bankCardNumber
      ? body.bankCardNumber.replace(/\s+/g, '')
      : null;
    if (cleaned && !/^\d{12,19}$/.test(cleaned)) {
      throw new BadRequestException('Karta raqami noto`g`ri');
    }
    return this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        bankCardNumber: cleaned,
        bankCardHolder: body.bankCardHolder?.trim() || null,
      },
      select: { bankCardNumber: true, bankCardHolder: true },
    });
  }

  // ---------- Admin --------------------------------------------------

  async adminListPayouts(filters: { status?: PayoutStatus; payeeType?: PayeeType } = {}) {
    const payouts = await this.prisma.payout.findMany({
      where: {
        status: filters.status,
        payeeType: filters.payeeType,
      },
      orderBy: { requestedAt: 'desc' },
      take: 200,
    });

    const sellerIds = payouts.filter((p) => p.payeeType === 'SELLER').map((p) => p.payeeId);
    const courierIds = payouts.filter((p) => p.payeeType === 'COURIER').map((p) => p.payeeId);
    const [sellers, couriers] = await Promise.all([
      sellerIds.length
        ? this.prisma.seller.findMany({
            where: { id: { in: sellerIds } },
            include: { user: { select: { fullName: true, phone: true } } },
          })
        : [],
      courierIds.length
        ? this.prisma.courier.findMany({
            where: { id: { in: courierIds } },
            include: { user: { select: { fullName: true, phone: true } } },
          })
        : [],
    ]);

    const sellerMap = new Map(sellers.map((s) => [s.id, s]));
    const courierMap = new Map(couriers.map((c) => [c.id, c]));

    return payouts.map((p) => ({
      ...p,
      payee:
        p.payeeType === 'SELLER'
          ? {
              displayName: sellerMap.get(p.payeeId)?.brandName ?? null,
              fullName: sellerMap.get(p.payeeId)?.user.fullName ?? null,
              phone: sellerMap.get(p.payeeId)?.user.phone ?? null,
            }
          : {
              displayName: courierMap.get(p.payeeId)?.user.fullName ?? null,
              fullName: courierMap.get(p.payeeId)?.user.fullName ?? null,
              phone: courierMap.get(p.payeeId)?.user.phone ?? null,
            },
    }));
  }

  async adminApprove(payoutId: string, adminUserId: string) {
    return this.transitionStatus(payoutId, adminUserId, PayoutStatus.APPROVED, ['PENDING']);
  }

  async adminMarkPaid(payoutId: string, adminUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { items: true },
      });
      if (!payout) throw new NotFoundException('Payout topilmadi');
      if (!['PENDING', 'APPROVED'].includes(payout.status)) {
        throw new BadRequestException('Bu payoutni paid deb belgilash mumkin emas');
      }

      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PAID,
          processedAt: new Date(),
          processedByUserId: adminUserId,
        },
      });

      const ledgerIds = payout.items.map((i) => i.ledgerEntryId);
      if (ledgerIds.length) {
        await tx.ledgerEntry.updateMany({
          where: { id: { in: ledgerIds } },
          data: {
            status: LedgerEntryStatus.PAID_OUT,
            paidOutAt: new Date(),
          },
        });
      }

      return tx.payout.findUnique({ where: { id: payoutId }, include: { items: true } });
    });
  }

  async adminReject(payoutId: string, adminUserId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { items: true },
      });
      if (!payout) throw new NotFoundException('Payout topilmadi');
      if (payout.status !== 'PENDING' && payout.status !== 'APPROVED') {
        throw new BadRequestException('Faqat PENDING/APPROVED holatdagini rad etish mumkin');
      }

      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.REJECTED,
          processedAt: new Date(),
          processedByUserId: adminUserId,
          rejectionReason: reason ?? null,
        },
      });

      // Detach ledger items so funds become available again.
      const ledgerIds = payout.items.map((i) => i.ledgerEntryId);
      if (ledgerIds.length) {
        await tx.payoutItem.deleteMany({ where: { payoutId } });
      }

      return tx.payout.findUnique({ where: { id: payoutId }, include: { items: true } });
    });
  }

  async adminFinancialOverview() {
    const [
      gmvAgg,
      commissionAgg,
      courierFeeAgg,
      platformRevenueAgg,
      pendingPayoutsAgg,
      sellerAvailable,
      courierAvailable,
      todayCommission,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true, subtotalAmount: true },
        _count: true,
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          type: 'COMMISSION',
          status: { in: [LedgerEntryStatus.AVAILABLE, LedgerEntryStatus.PAID_OUT] },
        },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          type: 'COURIER_FEE',
          status: { in: [LedgerEntryStatus.AVAILABLE, LedgerEntryStatus.PAID_OUT] },
        },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          payeeType: 'PLATFORM',
          status: { in: [LedgerEntryStatus.AVAILABLE, LedgerEntryStatus.PAID_OUT] },
        },
        _sum: { amount: true },
      }),
      this.prisma.payout.aggregate({
        where: { status: { in: [PayoutStatus.PENDING, PayoutStatus.APPROVED] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { payeeType: 'SELLER', status: LedgerEntryStatus.AVAILABLE },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { payeeType: 'COURIER', status: LedgerEntryStatus.AVAILABLE },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          type: 'COMMISSION',
          status: { in: [LedgerEntryStatus.AVAILABLE, LedgerEntryStatus.PAID_OUT] },
          createdAt: { gte: startOfToday() },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      gmv: Number(gmvAgg._sum.totalAmount ?? 0),
      gmvSubtotal: Number(gmvAgg._sum.subtotalAmount ?? 0),
      paidOrders: gmvAgg._count,
      totalCommission: Number(commissionAgg._sum.amount ?? 0),
      totalCourierFees: Number(courierFeeAgg._sum.amount ?? 0),
      totalPlatformRevenue: Number(platformRevenueAgg._sum.amount ?? 0),
      pendingPayoutAmount: Number(pendingPayoutsAgg._sum.amount ?? 0),
      pendingPayoutCount: pendingPayoutsAgg._count,
      sellerOwed: Number(sellerAvailable._sum.amount ?? 0),
      courierOwed: Number(courierAvailable._sum.amount ?? 0),
      todayCommission: Number(todayCommission._sum.amount ?? 0),
    };
  }

  async adminListSellersWithBalance() {
    const sellers = await this.prisma.seller.findMany({
      include: { user: { select: { fullName: true, phone: true } } },
      orderBy: { brandName: 'asc' },
    });
    const balances = await this.prisma.ledgerEntry.groupBy({
      by: ['payeeId', 'status'],
      where: { payeeType: 'SELLER' },
      _sum: { amount: true },
    });
    const map = new Map<string, { available: number; pending: number; paidOut: number }>();
    for (const row of balances) {
      if (!row.payeeId) continue;
      const cur = map.get(row.payeeId) ?? { available: 0, pending: 0, paidOut: 0 };
      const amt = Number(row._sum.amount ?? 0);
      if (row.status === 'AVAILABLE') cur.available = amt;
      else if (row.status === 'PENDING') cur.pending = amt;
      else if (row.status === 'PAID_OUT') cur.paidOut = amt;
      map.set(row.payeeId, cur);
    }
    return sellers.map((s) => ({
      id: s.id,
      brandName: s.brandName,
      legalName: s.legalName,
      fullName: s.user.fullName,
      phone: s.user.phone,
      commissionRate: Number(s.commissionRate),
      bankCardNumber: s.bankCardNumber,
      bankCardHolder: s.bankCardHolder,
      ...(map.get(s.id) ?? { available: 0, pending: 0, paidOut: 0 }),
    }));
  }

  async adminSetSellerCommission(sellerId: string, rate: number) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) {
      throw new BadRequestException('Komissiya 0 dan 0.5 (50%) gacha bo`lishi kerak');
    }
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { commissionRate: rate },
      select: { id: true, brandName: true, commissionRate: true },
    });
  }

  // ---------- Internals ----------------------------------------------

  private async summaryFor(
    payeeType: PayeeType,
    payeeId: string,
    extra: Record<string, unknown> = {},
  ) {
    const ledgerPayeeType =
      payeeType === 'SELLER' ? LedgerPayeeType.SELLER : LedgerPayeeType.COURIER;
    const [available, pending, paidOut, recentLedger, monthAgg] = await Promise.all([
      this.ledgerService.getAvailableBalance(ledgerPayeeType, payeeId),
      this.ledgerService.getPendingBalance(ledgerPayeeType, payeeId),
      this.ledgerService.getPaidOutTotal(ledgerPayeeType, payeeId),
      this.prisma.ledgerEntry.findMany({
        where: { payeeType: ledgerPayeeType, payeeId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
              deliveredAt: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          payeeType: ledgerPayeeType,
          payeeId,
          status: { in: [LedgerEntryStatus.AVAILABLE, LedgerEntryStatus.PAID_OUT] },
          createdAt: { gte: startOfMonth() },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      available,
      pending,
      paidOut,
      lifetimeEarned: available + paidOut,
      thisMonth: Number(monthAgg._sum.amount ?? 0),
      recentEntries: recentLedger.map((e) => ({
        id: e.id,
        type: e.type,
        amount: Number(e.amount),
        status: e.status,
        createdAt: e.createdAt,
        availableAt: e.availableAt,
        paidOutAt: e.paidOutAt,
        order: e.order,
      })),
      ...extra,
    };
  }

  private async historyFor(payeeType: PayeeType, payeeId: string) {
    return this.prisma.payout.findMany({
      where: { payeeType, payeeId },
      orderBy: { requestedAt: 'desc' },
      take: 100,
    });
  }

  private async ledgerListFor(payeeType: LedgerPayeeType, payeeId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { payeeType, payeeId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            deliveredAt: true,
            status: true,
          },
        },
      },
    });
  }

  private async requestPayout(params: {
    payeeType: PayeeType;
    ledgerPayeeType: LedgerPayeeType;
    payeeId: string;
    bankCardNumber: string;
    bankCardHolder?: string | null;
    requestedAmount?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const available = await tx.ledgerEntry.findMany({
        where: {
          payeeType: params.ledgerPayeeType,
          payeeId: params.payeeId,
          status: LedgerEntryStatus.AVAILABLE,
        },
        orderBy: { availableAt: 'asc' },
      });

      if (available.length === 0) {
        throw new BadRequestException('Yechib olish uchun mablag` mavjud emas');
      }

      let total = 0;
      const selected: typeof available = [];
      for (const entry of available) {
        const amt = Number(entry.amount);
        if (params.requestedAmount && total + amt > params.requestedAmount) break;
        selected.push(entry);
        total += amt;
        if (params.requestedAmount && total >= params.requestedAmount) break;
      }

      if (params.requestedAmount && total < params.requestedAmount) {
        throw new BadRequestException(
          'So`ralgan summa balansdan oshib ketdi yoki butun summani qoplaydigan mablag` topilmadi',
        );
      }

      if (selected.length === 0) {
        throw new BadRequestException('Yechib olish uchun mos yozuvlar topilmadi');
      }

      const payout = await tx.payout.create({
        data: {
          payeeType: params.payeeType,
          payeeId: params.payeeId,
          amount: total,
          status: PayoutStatus.PENDING,
          bankCardSnapshot: maskCard(params.bankCardNumber),
          bankCardHolderSnapshot: params.bankCardHolder ?? null,
          items: {
            create: selected.map((e) => ({
              ledgerEntryId: e.id,
              amount: e.amount,
            })),
          },
        },
        include: { items: true },
      });

      return payout;
    });
  }

  private async transitionStatus(
    payoutId: string,
    adminUserId: string,
    next: PayoutStatus,
    allowedFrom: PayoutStatus[],
  ) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout topilmadi');
    if (!allowedFrom.includes(payout.status)) {
      throw new BadRequestException('Bunday o`tish ruxsat etilmagan');
    }
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: next, processedByUserId: adminUserId, processedAt: new Date() },
    });
  }

  private async requireSeller(userId: string) {
    const seller = await this.prisma.seller.findFirst({ where: { userId } });
    if (!seller) throw new ForbiddenException('Sotuvchi profili topilmadi');
    return seller;
  }

  private async requireCourier(userId: string) {
    const courier = await this.prisma.courier.findFirst({ where: { userId } });
    if (!courier) throw new ForbiddenException('Kuryer profili topilmadi');
    return courier;
  }
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function maskCard(card: string): string {
  if (!card || card.length < 4) return '****';
  return `**** **** **** ${card.slice(-4)}`;
}

// Suppress unused Prisma import in some build configs
void Prisma;

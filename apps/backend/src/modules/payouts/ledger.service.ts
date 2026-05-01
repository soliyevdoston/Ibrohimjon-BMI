import { Injectable } from '@nestjs/common';
import {
  LedgerEntryStatus,
  LedgerEntryType,
  LedgerPayeeType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { PricingBreakdown } from '../pricing/pricing.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create the four ledger entries that exist from order creation:
   * - SELLER_PAYOUT (to seller)
   * - COMMISSION (to platform)
   * - DELIVERY_MARGIN (to platform)
   * - SERVICE_FEE (to platform)
   * COURIER_FEE entry is created separately when a courier accepts the delivery.
   * All entries start as PENDING; settlement flips them to AVAILABLE.
   */
  async createOrderEntries(
    tx: Tx,
    params: {
      orderId: string;
      sellerId: string;
      breakdown: PricingBreakdown;
    },
  ) {
    const { orderId, sellerId, breakdown } = params;

    const data: Prisma.LedgerEntryCreateManyInput[] = [];
    if (breakdown.sellerPayoutAmount > 0) {
      data.push({
        orderId,
        type: LedgerEntryType.SELLER_PAYOUT,
        payeeType: LedgerPayeeType.SELLER,
        payeeId: sellerId,
        amount: breakdown.sellerPayoutAmount,
        status: LedgerEntryStatus.PENDING,
      });
    }
    if (breakdown.platformCommissionAmount > 0) {
      data.push({
        orderId,
        type: LedgerEntryType.COMMISSION,
        payeeType: LedgerPayeeType.PLATFORM,
        amount: breakdown.platformCommissionAmount,
        status: LedgerEntryStatus.PENDING,
      });
    }
    const deliveryMargin = breakdown.deliveryFeeAmount - breakdown.courierFeeAmount;
    if (deliveryMargin !== 0) {
      data.push({
        orderId,
        type: LedgerEntryType.DELIVERY_MARGIN,
        payeeType: LedgerPayeeType.PLATFORM,
        amount: deliveryMargin,
        status: LedgerEntryStatus.PENDING,
      });
    }
    if (breakdown.serviceFeeAmount > 0) {
      data.push({
        orderId,
        type: LedgerEntryType.SERVICE_FEE,
        payeeType: LedgerPayeeType.PLATFORM,
        amount: breakdown.serviceFeeAmount,
        status: LedgerEntryStatus.PENDING,
      });
    }

    if (data.length === 0) return;
    await tx.ledgerEntry.createMany({ data });
  }

  /** Create the courier-fee entry when a courier accepts a delivery. */
  async createCourierEntry(
    tx: Tx,
    params: { orderId: string; courierId: string; amount: number },
  ) {
    if (params.amount <= 0) return;
    await tx.ledgerEntry.create({
      data: {
        orderId: params.orderId,
        type: LedgerEntryType.COURIER_FEE,
        payeeType: LedgerPayeeType.COURIER,
        payeeId: params.courierId,
        amount: params.amount,
        status: LedgerEntryStatus.PENDING,
      },
    });
  }

  /** When the customer pays, seller payout, commission, and service fee become AVAILABLE. */
  async markPaidSettlements(tx: Tx, orderId: string) {
    await tx.ledgerEntry.updateMany({
      where: {
        orderId,
        status: LedgerEntryStatus.PENDING,
        type: {
          in: [
            LedgerEntryType.SELLER_PAYOUT,
            LedgerEntryType.COMMISSION,
            LedgerEntryType.SERVICE_FEE,
          ],
        },
      },
      data: {
        status: LedgerEntryStatus.AVAILABLE,
        availableAt: new Date(),
      },
    });
  }

  /** When delivery is completed, courier fee + delivery margin become AVAILABLE
   *  (only if payment was already PAID — otherwise they stay PENDING). */
  async markDeliveredSettlements(tx: Tx, orderId: string, paymentPaid: boolean) {
    if (!paymentPaid) return;
    await tx.ledgerEntry.updateMany({
      where: {
        orderId,
        status: LedgerEntryStatus.PENDING,
        type: { in: [LedgerEntryType.COURIER_FEE, LedgerEntryType.DELIVERY_MARGIN] },
      },
      data: {
        status: LedgerEntryStatus.AVAILABLE,
        availableAt: new Date(),
      },
    });
  }

  /** Reverse all entries for an order (cancel/fail). */
  async reverseOrderEntries(tx: Tx, orderId: string) {
    await tx.ledgerEntry.updateMany({
      where: {
        orderId,
        status: { in: [LedgerEntryStatus.PENDING, LedgerEntryStatus.AVAILABLE] },
      },
      data: { status: LedgerEntryStatus.REVERSED },
    });
  }

  /** Sum AVAILABLE entries for a payee — this is their withdrawable balance. */
  async getAvailableBalance(
    payeeType: LedgerPayeeType,
    payeeId: string,
  ): Promise<number> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        payeeType,
        payeeId,
        status: LedgerEntryStatus.AVAILABLE,
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async getPendingBalance(
    payeeType: LedgerPayeeType,
    payeeId: string,
  ): Promise<number> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        payeeType,
        payeeId,
        status: LedgerEntryStatus.PENDING,
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async getPaidOutTotal(
    payeeType: LedgerPayeeType,
    payeeId: string,
  ): Promise<number> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        payeeType,
        payeeId,
        status: LedgerEntryStatus.PAID_OUT,
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}

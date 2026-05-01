import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import dayjs from 'dayjs';
import { PrismaService } from 'src/common/prisma.service';
import { LedgerService } from '../payouts/ledger.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
    private readonly ledgerService: LedgerService,
  ) {}

  async createPayment(customerId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId }, include: { payment: true } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Cannot pay for another user order');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        alreadyPaid: true,
        payment: order.payment,
      };
    }

    const redirectUrl = `https://payment-gateway.example/checkout?orderId=${order.id}`;

    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        status: PaymentStatus.PROCESSING,
        redirectUrl,
      },
      create: {
        orderId: order.id,
        provider: 'demo-pay',
        amount: order.totalAmount,
        status: PaymentStatus.PROCESSING,
        redirectUrl,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PROCESSING },
    });

    return {
      paymentId: payment.id,
      redirectUrl: payment.redirectUrl,
      expiresAt: dayjs().add(15, 'minute').toISOString(),
    };
  }

  async handleCallback(dto: PaymentCallbackDto) {
    const secret = this.configService.getOrThrow<string>('PAYMENT_CALLBACK_SECRET');
    const expected = createHmac('sha256', secret).update(dto.rawPayload).digest('hex');
    if (expected !== dto.signature) {
      throw new BadRequestException('Invalid callback signature');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (!existingPayment) {
      throw new NotFoundException('Payment record not found');
    }

    if (existingPayment.callbackIdempotency === dto.callbackId) {
      return {
        duplicate: true,
        status: existingPayment.status,
      };
    }

    const nextStatus = dto.status === 'paid' ? PaymentStatus.PAID : PaymentStatus.FAILED;

    const payment = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { orderId: dto.orderId },
        data: {
          externalPaymentId: dto.externalPaymentId,
          callbackIdempotency: dto.callbackId,
          status: nextStatus,
          failReason: dto.status === 'failed' ? 'Gateway declined transaction' : null,
          rawCallbackPayload: { payload: dto.rawPayload },
        },
      });

      await tx.order.update({
        where: { id: dto.orderId },
        data: {
          paymentStatus: nextStatus,
          ...(nextStatus === PaymentStatus.FAILED ? { status: OrderStatus.FAILED } : {}),
        },
      });

      if (nextStatus === PaymentStatus.PAID) {
        await this.ledgerService.markPaidSettlements(tx, dto.orderId);
        // If delivery already completed (rare race), also flip courier/margin entries
        const delivery = await tx.delivery.findUnique({
          where: { orderId: dto.orderId },
          select: { status: true },
        });
        if (delivery?.status === 'DELIVERED') {
          await this.ledgerService.markDeliveredSettlements(tx, dto.orderId, true);
        }
      } else {
        await this.ledgerService.reverseOrderEntries(tx, dto.orderId);
      }

      return updatedPayment;
    });

    this.realtimeService.publishOrderStatus(dto.orderId, nextStatus === PaymentStatus.PAID ? 'PAID' : 'PAYMENT_FAILED');

    return {
      duplicate: false,
      paymentId: payment.id,
      status: payment.status,
    };
  }

  async markExpiredPayments() {
    const threshold = dayjs().subtract(15, 'minute').toDate();

    const stale = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PROCESSING,
        createdAt: { lt: threshold },
      },
      select: {
        id: true,
        orderId: true,
      },
    });

    if (!stale.length) {
      return { expiredCount: 0 };
    }

    const staleIds = stale.map((p) => p.id);
    const staleOrderIds = stale.map((p) => p.orderId);

    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { id: { in: staleIds } },
        data: { status: PaymentStatus.EXPIRED },
      }),
      this.prisma.order.updateMany({
        where: { id: { in: staleOrderIds }, paymentStatus: PaymentStatus.PROCESSING },
        data: { paymentStatus: PaymentStatus.EXPIRED },
      }),
    ]);

    return { expiredCount: stale.length };
  }
}

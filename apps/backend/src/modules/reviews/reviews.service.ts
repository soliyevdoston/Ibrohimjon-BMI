import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  list(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
      },
      take: 100,
    });
  }

  // Upsert (one review per user per product). Only customers who actually
  // ordered the product (status DELIVERED) can leave a review.
  async upsert(userId: string, productId: string, rating: number, comment?: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Reyting 1 dan 5 gacha bo\'lishi kerak');
    }
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    // Verify the user actually bought this product (delivered).
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { customerId: userId, status: 'DELIVERED' },
      },
    });
    if (!purchased) {
      throw new ForbiddenException('Faqat yetkazib berilgan buyurtmadan keyin sharh qoldira olasiz');
    }

    const review = await this.prisma.review.upsert({
      where: { productId_userId: { productId, userId } },
      update: { rating, comment },
      create: { productId, userId, rating, comment },
    });

    // Recompute the seller's rolling rating across all their products.
    await this.recomputeSellerRating(product.sellerId);

    return review;
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { sellerId: true } } },
    });
    if (!review) throw new NotFoundException('Sharh topilmadi');
    if (review.userId !== userId) throw new ForbiddenException('Boshqa sharhni o\'chira olmaysiz');
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recomputeSellerRating(review.product.sellerId);
    return { ok: true };
  }

  async stats(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return {
      avgRating: Number(agg._avg.rating ?? 0),
      reviewsCount: agg._count._all,
    };
  }

  private async recomputeSellerRating(sellerId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { product: { sellerId } },
      _avg: { rating: true },
    });
    const avg = agg._avg.rating ?? 5;
    await this.prisma.seller.update({
      where: { id: sellerId },
      data: { rating: avg },
    });
  }
}

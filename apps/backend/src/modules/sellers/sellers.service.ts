import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(userId: string, payload: {
    legalName: string;
    brandName: string;
    description?: string;
    addressText?: string;
    addressLat?: number;
    addressLng?: number;
  }) {
    return this.prisma.seller.upsert({
      where: { userId },
      update: payload,
      create: {
        userId,
        legalName: payload.legalName,
        brandName: payload.brandName,
        description: payload.description,
        addressText: payload.addressText,
        addressLat: payload.addressLat,
        addressLng: payload.addressLng,
      },
    });
  }

  // Returns the seller profile, lazily creating one for sellers who registered
  // before auto-provisioning landed. Keeps /products and /orders endpoints
  // working on first call without requiring the user to visit /settings first.
  async myProfile(userId: string) {
    const existing = await this.prisma.seller.findFirst({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const defaultName = user.fullName?.trim()
      || user.email?.split('@')[0]
      || user.phone
      || 'Sotuvchi';
    const created = await this.prisma.seller.create({
      data: { userId, legalName: defaultName, brandName: defaultName },
    });
    return { ...created, transactions: [] };
  }

  async myBalance(userId: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { userId },
      select: { balance: true },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return { balance: Number(seller.balance) };
  }
}

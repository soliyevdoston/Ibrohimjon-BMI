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

  async myProfile(userId: string) {
    const seller = await this.prisma.seller.findFirst({ where: { userId } });
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    return seller;
  }
}

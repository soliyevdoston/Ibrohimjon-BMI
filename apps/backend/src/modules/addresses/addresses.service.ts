import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, payload: {
    label: string;
    addressText: string;
    lat: number;
    lng: number;
    isDefault?: boolean;
  }) {
    if (!payload.label?.trim() || !payload.addressText?.trim()) {
      throw new BadRequestException('Manzil va nomi kerak');
    }
    if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
      throw new BadRequestException('Koordinatalar noto\'g\'ri');
    }
    return this.prisma.$transaction(async (tx) => {
      // If this is the user's first address, force it default. Otherwise
      // respect the flag and clear others.
      const count = await tx.customerAddress.count({ where: { userId } });
      const isDefault = count === 0 ? true : !!payload.isDefault;
      if (isDefault) {
        await tx.customerAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.customerAddress.create({
        data: {
          userId,
          label: payload.label.trim(),
          addressText: payload.addressText.trim(),
          lat: payload.lat,
          lng: payload.lng,
          isDefault,
        },
      });
    });
  }

  async update(userId: string, id: string, patch: Partial<{
    label: string;
    addressText: string;
    lat: number;
    lng: number;
    isDefault: boolean;
  }>) {
    const existing = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manzil topilmadi');
    if (existing.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      if (patch.isDefault) {
        await tx.customerAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.customerAddress.update({
        where: { id },
        data: {
          label: patch.label?.trim(),
          addressText: patch.addressText?.trim(),
          lat: patch.lat,
          lng: patch.lng,
          isDefault: patch.isDefault,
        },
      });
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.customerAddress.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manzil topilmadi');
    if (existing.userId !== userId) throw new ForbiddenException();
    await this.prisma.customerAddress.delete({ where: { id } });

    // If we just removed the default, promote the next one
    if (existing.isDefault) {
      const next = await this.prisma.customerAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.customerAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    return { ok: true };
  }
}

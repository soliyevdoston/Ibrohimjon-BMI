import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(userId: string, payload: { vehicleType?: string }) {
    return this.prisma.courier.upsert({
      where: { userId },
      update: {
        vehicleType: payload.vehicleType,
      },
      create: {
        userId,
        vehicleType: payload.vehicleType,
      },
    });
  }

  async setPresence(userId: string, body: { isOnline: boolean; isAvailable: boolean }) {
    const courier = await this.prisma.courier.findFirst({ where: { userId } });
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }

    return this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        isOnline: body.isOnline,
        isAvailable: body.isAvailable,
        lastSeenAt: new Date(),
      },
    });
  }

  async myProfile(userId: string) {
    const courier = await this.prisma.courier.findFirst({ where: { userId } });
    if (!courier) {
      throw new NotFoundException('Courier profile not found');
    }
    return courier;
  }
}

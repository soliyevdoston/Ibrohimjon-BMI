import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  listAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(payload: { title: string; imageUrl: string; linkUrl?: string; position?: number; isActive?: boolean }) {
    if (!payload.title?.trim() || !payload.imageUrl?.trim()) {
      throw new BadRequestException('Sarlavha va rasm URL kerak');
    }
    return this.prisma.banner.create({
      data: {
        title: payload.title.trim(),
        imageUrl: payload.imageUrl.trim(),
        linkUrl: payload.linkUrl?.trim() || null,
        position: payload.position ?? 0,
        isActive: payload.isActive ?? true,
      },
    });
  }

  async update(id: string, patch: Partial<{ title: string; imageUrl: string; linkUrl: string; position: number; isActive: boolean }>) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner topilmadi');
    return this.prisma.banner.update({
      where: { id },
      data: {
        title: patch.title?.trim(),
        imageUrl: patch.imageUrl?.trim(),
        linkUrl: patch.linkUrl === undefined ? undefined : (patch.linkUrl?.trim() || null),
        position: patch.position,
        isActive: patch.isActive,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner topilmadi');
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true };
  }
}

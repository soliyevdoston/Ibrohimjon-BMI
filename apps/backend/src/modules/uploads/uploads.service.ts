import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  save(data: Buffer, mimeType: string) {
    return this.prisma.upload.create({ data: { data, mimeType } });
  }

  findOne(id: string) {
    return this.prisma.upload.findUnique({ where: { id } });
  }
}

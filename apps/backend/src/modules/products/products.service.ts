import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsDto) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(query.search
        ? {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            price: {
              gte: query.minPrice,
              lte: query.maxPrice,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: {
            select: { id: true, brandName: true, rating: true },
          },
        },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async createBySeller(sellerUserId: string, dto: CreateProductDto) {
    const seller = await this.prisma.seller.findFirst({ where: { userId: sellerUserId } });
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        price: dto.price,
        stock: dto.stock,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBySeller(productId: string, sellerUserId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { seller: true } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.seller.userId !== sellerUserId) {
      throw new ForbiddenException('You are not allowed to edit this product');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
  }

  async deleteBySeller(productId: string, sellerUserId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { seller: true } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.seller.userId !== sellerUserId) {
      throw new ForbiddenException('You are not allowed to delete this product');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  async categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}

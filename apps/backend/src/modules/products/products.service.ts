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
    const seller = await this.ensureSellerProfile(sellerUserId);

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

  // Returns the seller profile for this user, lazily creating one with sensible
  // defaults if missing. Lets users who registered before auto-provisioning was
  // added still start using the platform without manually filling /settings.
  private async ensureSellerProfile(sellerUserId: string) {
    const existing = await this.prisma.seller.findFirst({ where: { userId: sellerUserId } });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: sellerUserId } });
    if (!user) throw new NotFoundException('User not found');
    const defaultName = user.fullName?.trim()
      || user.email?.split('@')[0]
      || user.phone
      || 'Sotuvchi';
    return this.prisma.seller.create({
      data: {
        userId: sellerUserId,
        legalName: defaultName,
        brandName: defaultName,
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

  async listForSeller(sellerUserId: string, query: ListProductsDto) {
    const seller = await this.ensureSellerProfile(sellerUserId);

    const where: Prisma.ProductWhereInput = {
      sellerId: seller.id,
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, meta: { page: query.page, limit: query.limit, total } };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: { id: true, brandName: true, rating: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return product;
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BannersService } from './banners.service';

@Controller()
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  // Public — used by customer home page
  @Get('banners')
  listActive() {
    return this.banners.listActive();
  }

  // Admin CRUD
  @Get('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.banners.listAll();
  }

  @Post('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() body: { title: string; imageUrl: string; linkUrl?: string; position?: number; isActive?: boolean }) {
    return this.banners.create(body);
  }

  @Patch('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ title: string; imageUrl: string; linkUrl: string; position: number; isActive: boolean }>,
  ) {
    return this.banners.update(id, body);
  }

  @Delete('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}

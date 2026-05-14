import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.favorites.list(userId);
  }

  @Get('ids')
  ids(@CurrentUser('id') userId: string) {
    return this.favorites.ids(userId);
  }

  @Post(':productId/toggle')
  toggle(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.favorites.toggle(userId, productId);
  }
}

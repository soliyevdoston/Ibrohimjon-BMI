import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('products/:id/reviews')
  list(@Param('id') productId: string) {
    return this.reviews.list(productId);
  }

  @Post('products/:id/reviews')
  @UseGuards(JwtAuthGuard)
  upsert(
    @Param('id') productId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviews.upsert(userId, productId, body.rating, body.comment);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') reviewId: string, @CurrentUser('id') userId: string) {
    return this.reviews.remove(userId, reviewId);
  }
}

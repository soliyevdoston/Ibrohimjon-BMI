import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerCardsService } from './customer-cards.service';

@Controller('customer/cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CustomerCardsController {
  constructor(private readonly cards: CustomerCardsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.cards.list(userId);
  }

  @Post()
  add(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      cardNumber: string;
      holderName: string;
      expiryMonth: number;
      expiryYear: number;
      setDefault?: boolean;
    },
  ) {
    return this.cards.add(userId, body);
  }

  @Patch(':id/default')
  setDefault(@CurrentUser('id') userId: string, @Param('id') cardId: string) {
    return this.cards.setDefault(userId, cardId);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') cardId: string) {
    return this.cards.remove(userId, cardId);
  }
}

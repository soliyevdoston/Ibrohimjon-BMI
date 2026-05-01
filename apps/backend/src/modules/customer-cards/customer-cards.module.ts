import { Module } from '@nestjs/common';
import { CustomerCardsController } from './customer-cards.controller';
import { CustomerCardsService } from './customer-cards.service';

@Module({
  controllers: [CustomerCardsController],
  providers: [CustomerCardsService],
  exports: [CustomerCardsService],
})
export class CustomerCardsModule {}

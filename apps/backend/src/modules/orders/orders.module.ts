import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { PayoutsModule } from '../payouts/payouts.module';
import { CustomerCardsModule } from '../customer-cards/customer-cards.module';

@Module({
  imports: [RealtimeModule, PayoutsModule, CustomerCardsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

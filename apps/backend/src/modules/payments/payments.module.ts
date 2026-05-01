import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [RealtimeModule, PayoutsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

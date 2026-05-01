import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { LedgerService } from './ledger.service';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [PricingModule],
  controllers: [PayoutsController],
  providers: [LedgerService, PayoutsService],
  exports: [LedgerService, PayoutsService],
})
export class PayoutsModule {}

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SeedService } from './seed.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [RealtimeModule, PayoutsModule],
  controllers: [AdminController],
  providers: [AdminService, SeedService],
})
export class AdminModule {}

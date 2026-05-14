import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { HealthModule } from './modules/health/health.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { CouriersModule } from './modules/couriers/couriers.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { CustomerCardsModule } from './modules/customer-cards/customer-cards.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { BannersModule } from './modules/banners/banners.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    PricingModule,
    PayoutsModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    DeliveriesModule,
    PaymentsModule,
    AdminModule,
    RealtimeModule,
    HealthModule,
    SellersModule,
    CouriersModule,
    CustomerCardsModule,
    ReviewsModule,
    FavoritesModule,
    AddressesModule,
    BannersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
  ],
})
export class AppModule {}

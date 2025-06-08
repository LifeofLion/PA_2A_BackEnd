import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service.js';
import { StripeController } from 'stripe.controller';
import Stripe from 'stripe';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
          throw new Error('La variable STRIPE_SECRET_KEY est manquante dans le .env');
        }
        return new Stripe(secretKey, {
          apiVersion: '2025-05-28.basil',
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}

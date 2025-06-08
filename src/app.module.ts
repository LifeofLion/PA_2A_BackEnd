import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeModule } from './stripe/stripe.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,      
      envFilePath: '.env',  
    }),
    StripeModule,           
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

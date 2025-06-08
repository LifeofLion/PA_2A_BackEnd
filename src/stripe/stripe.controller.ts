import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from 'stripe.service';
import { ConfigService } from '@nestjs/config';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  // ─── 1) CLIENTS & PM ─────────────────────────────────────────────────────────

  @Post('customers')
  async createCustomer(@Body() body: { email: string; description: string }) {
    return this.stripeService.createCustomer(body.email, body.description);
  }

  @Post('customers/:id/attach-payment')
  async attachPaymentMethod(
    @Param('id') customerId: string,
    @Body() body: { paymentMethodId: string },
  ) {
    await this.stripeService.attachPaymentMethod(customerId, body.paymentMethodId);
    return { success: true };
  }

  // ─── 2) ABONNEMENTS ──────────────────────────────────────────────────────────

  @Post('subscriptions')
  async createSubscription(
    @Body() body: { customerId: string; priceId: string; startDate?: string },
  ) {
    const startDateObj = body.startDate ? new Date(body.startDate) : undefined;
    return this.stripeService.createSubscription(body.customerId, body.priceId, startDateObj);
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Param('id') subscriptionId: string) {
    return this.stripeService.cancelSubscriptionAtPeriodEnd(subscriptionId);
  }

  // ─── 3) PAIEMENT ONE-SHOT ────────────────────────────────────────────────────

  @Post('charge')
  async chargeCustomer(
    @Body() body: { customerId: string; amount: number; description: string },
  ) {
    return this.stripeService.chargeCustomer(body.customerId, body.amount, body.description);
  }

  // ─── 4) PRODUITS & PRIX ─────────────────────────────────────────────────────

  @Post('prices')
  async createPrice(
    @Body() body: { planName: string; planPrice: number },
  ) {
    return this.stripeService.createPriceForPlan(body.planName, body.planPrice);
  }

  // ─── 5) STATISTIQUES ────────────────────────────────────────────────────────

  @Get('stats/customers')
  async getCustomerStats() {
    return this.stripeService.getCustomerStats();
  }

  @Get('stats/subscribers')
  async getActiveSubscribers() {
    const count = await this.stripeService.getActiveSubscribers();
    return { activeCount: count };
  }

  @Get('stats/payments')
  async getPaymentStats() {
    return this.stripeService.getPaymentStats();
  }

  @Post('stats/revenue')
  async getRevenue(@Body() body: { startDate: number; endDate: number }) {
    const rev = await this.stripeService.getTotalRevenue(body.startDate, body.endDate);
    return { totalRevenueEuro: rev };
  }

  // ─── 6) STRIPE CONNECT ──────────────────────────────────────────────────────

  @Post('connect/express')
  async createExpressAccount() {
    return this.stripeService.createExpressAccount();
  }

  @Post('connect/custom')
  async createCustomAccount(@Body() body: { accountToken: string }) {
    return this.stripeService.createConnectedAccountWithToken(body.accountToken);
  }

  @Get('connect/:accountId/status')
  async getAccountStatus(@Param('accountId') accountId: string) {
    return this.stripeService.getStripeAccountStatus(accountId);
  }

  @Post('connect/:accountId/link')
  async getAccountLink(@Param('accountId') accountId: string) {
    return { url: await this.stripeService.createAccountLink(accountId) };
  }

  @Post('connect/:accountId/transfer')
  async transferToConnectedAccount(
    @Param('accountId') accountId: string,
    @Body() body: { amount: number },
  ) {
    return this.stripeService.transferToConnectedAccount(accountId, body.amount);
  }

  // ─── 7) WEBHOOK ─────────────────────────────────────────────────────────────

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request) {
    // Attention : main.ts doit avoir bodyParser.raw({ type: 'application/json' }) pour cette route
    const rawBody = (req as any).rawBody as Buffer;
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
    try {
      event = this.stripeService['stripeClient'].webhooks.constructEvent(
        rawBody,
        sig as string,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err: any) {
      throw new BadRequestException(`Signature invalide : ${err.message}`);
    }

    // Traitez ici les événements qui vous intéressent
    switch (event.type) {
      case 'invoice.payment_succeeded':
        this.stripeService['logger'].log('Invoice payée : traiter...');
        break;
      case 'payment_intent.succeeded':
        this.stripeService['logger'].log('Paiement réussi : traiter...');
        break;
      case 'charge.refunded':
        this.stripeService['logger'].log('Charge remboursée : traitement…');
      break;
      default:
        this.stripeService['logger'].log(`Événement non géré : ${event.type}`);
    }

    return { received: true };
  }
}

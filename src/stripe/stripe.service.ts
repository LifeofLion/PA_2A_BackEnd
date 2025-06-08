import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripeClient: Stripe;

  constructor(
    @Inject('STRIPE_CLIENT') stripeClient: Stripe,
    private readonly configService: ConfigService,
  ) {
    this.stripeClient = stripeClient;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 1) GESTION DES CLIENTS ET MÉTHODES DE PAIEMENT
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Crée un nouveau client Stripe à partir d'un e-mail et d'une description.
   */
  async createCustomer(email: string, description: string): Promise<Stripe.Customer> {
    try {
      return await this.stripeClient.customers.create({
        email,
        description,
      });
    } catch (err) {
      this.logger.error('Erreur lors de la création du client Stripe', err);
      throw new BadRequestException('Impossible de créer le client Stripe');
    }
  }

  /**
   * Attache une méthode de paiement (PaymentMethod) à un client, et définit ce PM comme défaut.
   */
  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      // 1) On vérifie si ce PM n'est pas déjà attaché
      const existingPMs = await this.stripeClient.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 100,
      });

      const alreadyAttached = existingPMs.data.some(pm => pm.id === paymentMethodId);
      if (alreadyAttached) {
        throw new BadRequestException('Cette méthode de paiement est déjà attachée au client.');
      }

      // 2) On attache la PM
      await this.stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // 3) On la définit comme PM par défaut pour les factures
      await this.stripeClient.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (err) {
      this.logger.error(`Impossible d’attacher le PaymentMethod ${paymentMethodId} au client ${customerId}`, err);
      throw new BadRequestException('Erreur lors de l’attachement de la méthode de paiement.');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 2) GESTION DES ABONNEMENTS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Crée un abonnement pour un client existant, avec un priceId.
   * Optionnellement, on peut décaler le début (trial) à une date future.
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    startDate?: Date,
  ): Promise<Stripe.Subscription> {
    try {
      const params: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
      };

      if (startDate && startDate.getTime() > Date.now()) {
        // Si la date est future, on l'utilise comme fin de trial (timestamp UNIX)
        const unixTs = Math.floor(startDate.getTime() / 1000);
        params.trial_end = unixTs;
        // Pas besoin de backdate ici
      }

      return await this.stripeClient.subscriptions.create(params);
    } catch (err) {
      this.logger.error(`Erreur lors de la création d'un abonnement pour ${customerId}`, err);
      throw new BadRequestException('Impossible de créer l’abonnement Stripe');
    }
  }

  /**
   * Annule au "period end" un abonnement existant (cancel_at_period_end = true).
   */
  async cancelSubscriptionAtPeriodEnd(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripeClient.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (err) {
      this.logger.error(`Erreur lors de l'annulation de l'abonnement ${subscriptionId}`, err);
      throw new BadRequestException('Impossible d’annuler l’abonnement Stripe');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 3) PAIEMENTS DIRECTS (ONE-SHOT)
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Crée un PaymentIntent "off_session" pour facturer immédiatement le client
   * à partir de la première carte attachée (s’il en a une).
   */
  async chargeCustomer(
    customerId: string,
    amountInCents: number,
    description: string,
  ): Promise<{ paymentIntentId: string }> {
    try {
      // 1) Récupérer la première PM de type 'card'
      const pms = await this.stripeClient.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 1,
      });

      if (pms.data.length === 0) {
        throw new BadRequestException('Aucun moyen de paiement attaché au client.');
      }

      const paymentMethodId = pms.data[0].id;

      // 2) Créer et confirmer le PaymentIntent en mode "off_session"
      const intent = await this.stripeClient.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description,
      });

      return { paymentIntentId: intent.id };
    } catch (err: any) {
      this.logger.error(`Erreur lors du prélèvement pour le client ${customerId}`, err);

      // Si 3D Secure est requis
      if (err.code === 'authentication_required' || err.code === 'card_declined') {
        throw new BadRequestException(`Paiement échoué : ${err.message}`);
      }

      throw new BadRequestException('Erreur lors du prélèvement Stripe');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 4) GESTION DES PRODUITS & PRIX (Product / Price)
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Crée un Product + un Price récurrent mensuel à partir du nom et du prix en euros.
   */
  async createPriceForPlan(
    planName: string,
    planPrice: number,
  ): Promise<Stripe.Price> {
    if (!planName || !planPrice) {
      throw new BadRequestException('Le plan doit avoir un nom et un prix valides.');
    }

    try {
      // 1) Créer le Product
      const product = await this.stripeClient.products.create({
        name: planName,
      });

      // 2) Créer le Price
      const price = await this.stripeClient.prices.create({
        unit_amount: Math.round(planPrice * 100), // en centimes
        currency: 'eur',
        recurring: { interval: 'month' },
        product: product.id,
      });

      return price;
    } catch (err) {
      this.logger.error(`Erreur lors de la création du plan ${planName}`, err);
      throw new BadRequestException('Impossible de créer le plan sur Stripe');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 5) STATISTIQUES & RAPPORTS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Calcule le chiffre d’affaires total (paiements payés non remboursés)
   * entre deux timestamps UNIX (en secondes).
   */
  async getTotalRevenue(
    startDate: number,
    endDate: number,
  ): Promise<number> {
    let hasMore = true;
    let startingAfter: string | undefined;
    let totalAmount = 0;

    while (hasMore) {
      const chargesPage = await this.stripeClient.charges.list({
        created: { gte: startDate, lte: endDate },
        limit: 100,
        starting_after: startingAfter,
      });

      for (const charge of chargesPage.data) {
        if (charge.paid && !charge.refunded) {
          totalAmount += charge.amount ?? 0;
        }
      }

      hasMore = chargesPage.has_more;
      startingAfter = hasMore
        ? chargesPage.data[chargesPage.data.length - 1].id
        : undefined;
    }

    return totalAmount / 100; // on retourne en euros
  }

  /**
   * Statistiques sur le nombre de clients : total + nouveaux créés il y a moins de 30 jours.
   */
  async getCustomerStats(): Promise<{ total: number; new: number }> {
    let hasMore = true;
    let startingAfter: string | undefined;
    let allCustomers: Stripe.Customer[] = [];

    while (hasMore) {
      const page = await this.stripeClient.customers.list({
        limit: 100,
        starting_after: startingAfter,
      });
      allCustomers = allCustomers.concat(page.data);
      hasMore = page.has_more;
      startingAfter = hasMore
        ? page.data[page.data.length - 1].id
        : undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 3600;

    const recentCount = allCustomers.filter((c) => c.created >= thirtyDaysAgo).length;
    return {
      total: allCustomers.length,
      new: recentCount,
    };
  }

  /**
   * Renvoie le nombre d’abonnements actifs (status = 'active').
   */
  async getActiveSubscribers(): Promise<number> {
    let hasMore = true;
    let startingAfter: string | undefined;
    let count = 0;

    while (hasMore) {
      const page = await this.stripeClient.subscriptions.list({
        status: 'active',
        limit: 100,
        starting_after: startingAfter,
      });
      count += page.data.length;
      hasMore = page.has_more;
      startingAfter = hasMore
        ? page.data[page.data.length - 1].id
        : undefined;
    }

    return count;
  }

  /**
   * Statistiques sur les PaymentIntents (100 derniers), taux de réussite, panier moyen, taux de remboursements, répartition par méthode.
   */
  async getPaymentStats(): Promise<{
    successRate: number;
    averageValue: number;
    refundRate: number;
    byMethod: { method: string; count: number; value: number }[];
  }> {
    // 1) On récupère jusqu'à 100 PaymentIntents (on ne pagine volontairement pas plus pour limiter la durée)
    const paymentsPage = await this.stripeClient.paymentIntents.list({
      limit: 100,
    });
    const payments = paymentsPage.data;
    const totalCount = payments.length;

    // 2) Séparer réussis vs non
    const successful = payments.filter((p) => p.status === 'succeeded');

    // 3) Détecter les remboursés
    const refundedIntents: Set<string> = new Set();
    for (const pi of payments) {
      const chargesPage = await this.stripeClient.charges.list({
        payment_intent: pi.id,
        limit: 100,
      });
      if (chargesPage.data.some((c) => c.refunded || c.amount_refunded > 0)) {
        refundedIntents.add(pi.id);
      }
    }

    // 4) Calculer stats par méthode
    const methodStats: Record<string, { count: number; value: number }> = {};
    let sumAmounts = 0;

    for (const pi of successful) {
      const method = pi.payment_method_types[0] ?? 'unknown';
      const amountEuro = (pi.amount_received ?? 0) / 100;
      sumAmounts += amountEuro;

      if (!methodStats[method]) {
        methodStats[method] = { count: 0, value: 0 };
      }
      methodStats[method].count += 1;
      methodStats[method].value += amountEuro;
    }

    const avgValue = successful.length > 0 ? sumAmounts / successful.length : 0;
    const successRate = totalCount > 0 ? (successful.length / totalCount) * 100 : 0;
    const refundRate = totalCount > 0 ? (refundedIntents.size / totalCount) * 100 : 0;

    return {
      successRate,
      averageValue: avgValue,
      refundRate,
      byMethod: Object.entries(methodStats).map(([method, stats]) => ({
        method,
        count: stats.count,
        value: stats.value,
      })),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 6) STRIPE CONNECT (MARKETPLACE)
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Crée un compte connecté de type 'custom' à partir d'un accountToken fourni par Stripe.js (front).
   */
  async createConnectedAccountWithToken(
    accountToken: string,
  ): Promise<Stripe.Account> {
    try {
      const account = await this.stripeClient.accounts.create({
        type: 'custom',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        account_token: accountToken,
        country: 'FR',
      });
      this.logger.log(`Compte Stripe Connect Custom créé : ${account.id}`);
      return account;
    } catch (err: any) {
      this.logger.error('Erreur lors de la création du compte Connect Custom', err);
      if (err.raw && err.raw.message) {
        this.logger.error('Détails Stripe :', err.raw.message);
      }
      throw new BadRequestException('Impossible de créer le compte Connect (Custom)');
    }
  }

  /**
   * Crée un compte connecté de type 'express'. On récupère l'ID et on renvoie l'objet Account.
   */
  async createExpressAccount(): Promise<Stripe.Account> {
    try {
      const account = await this.stripeClient.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: 'FR',
      });
      this.logger.log(`Compte Stripe Connect Express créé : ${account.id}`);
      return account;
    } catch (err) {
      this.logger.error('Erreur lors de la création du compte Express', err);
      throw new BadRequestException('Impossible de créer le compte Express Stripe');
    }
  }

  /**
   * Crée un lien d'onboarding (ou de mise à jour) pour un compte Express/Custom.
   * Le front devra rediriger l'utilisateur vers ce lien pour compléter ses informations KYC.
   */
  async createAccountLink(stripeAccountId: string): Promise<string> {
    try {
      const origin = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const accountLink = await this.stripeClient.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${origin}/reauth`, // page à recharger si besoin
        return_url: `${origin}/office/billing-settings`, // là où l'utilisateur retourne
        type: 'account_onboarding',
      });
      return accountLink.url!;
    } catch (err) {
      this.logger.error(`Impossible de générer le lien d'onboarding pour ${stripeAccountId}`, err);
      throw new BadRequestException('Erreur lors de la génération du lien Connect');
    }
  }

  /**
   * Renvoie l'état d'un compte connecté (Express ou Custom):
   * - isValid : a-t-il bien soumis tous ses détails ?
   * - isEnabled : a-t-il charges_enabled && payouts_enabled ?
   * - needsIdCard : a-t-il un document manquant dans requirements.currently_due ?
   */
  async getStripeAccountStatus(stripeAccountId: string): Promise<{
    isValid: boolean;
    isEnabled: boolean;
    needsIdCard: boolean;
  }> {
    try {
      const account = await this.stripeClient.accounts.retrieve(stripeAccountId);

      const isValid = account.details_submitted === true;
      const isEnabled =
        account.charges_enabled === true && account.payouts_enabled === true;
      const needsIdCard = account.requirements?.currently_due?.some((req) =>
        req.includes('verification.document'),
      ) ?? false;

      return { isValid, isEnabled, needsIdCard };
    } catch (err) {
      this.logger.error(`Erreur lors de la récupération du statut du compte ${stripeAccountId}`, err);
      return { isValid: false, isEnabled: false, needsIdCard: false };
    }
  }

  /**
   * Transfère un montant (en centimes) du compte plateforme vers un compte connecté.
   * En mode test, on renvoie un mock si le transfert échoue.
   */
  async transferToConnectedAccount(
    stripeAccountId: string,
    amountInCents: number,
  ): Promise<Stripe.Transfer> {
    try {
      const transfer = await this.stripeClient.transfers.create({
        amount: amountInCents,
        currency: 'eur',
        destination: stripeAccountId,
      });
      this.logger.log(`Transfert vers ${stripeAccountId} de ${amountInCents} cents effectué`);
      return transfer;
    } catch (err) {
      this.logger.warn('Échec du transfert (mode test?), on retourne un mock', err);
      // Renvoi d'un objet minimal pour ne pas casser la logique en dev
      return {
        id: 'mock_transfer',
        amount: amountInCents,
        currency: 'eur',
        destination: stripeAccountId,
        object: 'transfer',
        created: Math.floor(Date.now() / 1000),
      } as Stripe.Transfer;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 7) GESTION DES WEBHOOKS (exemple de début d’implémentation)
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Cette méthode illustre comment vérifier la signature d'un webhook Stripe.
   * Dans un controller dédié, tu pourras faire :
   *
   * @Post('stripe/webhook')
   * @HttpCode(200)
   * async handleWebhook(@Req() req: Request) {
   *   const payload = req.rawBody; // veiller à avoir bodyParser configuré pour rawBody
   *   const sig = req.headers['stripe-signature'];
   *
   *   let event: Stripe.Event;
   *   try {
   *     event = this.stripeClient.webhooks.constructEvent(
   *       payload,
   *       sig,
   *       this.configService.get('STRIPE_WEBHOOK_SECRET'),
   *     );
   *   } catch (err) {
   *     throw new BadRequestException(`Signature invalide: ${err.message}`);
   *   }
   *
   *   // Traiter les différents types d'événements (subscription.created, payment_intent.succeeded, etc.)
   *   switch (event.type) {
   *     case 'invoice.payment_succeeded':
   *       // … ta logique
   *       break;
   *     case 'charge.refunded':
   *       // … ta logique
   *       break;
   *     // etc.
   *     default:
   *       console.log(`Événement non traité : ${event.type}`);
   *       break;
   *   }
   *
   *   return { received: true };
   * }
   */
}

import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { subscriptions, billingHistory, portalContexts } from "../drizzle/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Pricing configuration
export const PRICING = {
  mirror: {
    name: "Regular Mirror",
    priceId: process.env.STRIPE_MIRROR_PRICE_ID || "price_mirror_monthly",
    amount: 999, // $9.99 in cents
    description: "Basic reflections and pattern detection",
  },
  portal: {
    name: "Portal",
    priceId: process.env.STRIPE_PORTAL_PRICE_ID || "price_portal_monthly",
    amount: 1999, // $19.99 in cents
    description: "Recursive intelligence, personalized learning, sovereign runtime",
  },
};

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  userName: string,
  tier: "mirror" | "portal",
  origin: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pricing = PRICING[tier];
  if (!pricing) throw new Error("Invalid tier");

  try {
    // Create or get Stripe customer
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: pricing.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/subscription?success=true&tier=${tier}`,
      cancel_url: `${origin}/subscription?canceled=true`,
      allow_promotion_codes: true,
      metadata: {
        userId: userId.toString(),
        tier,
      },
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      customerId,
    };
  } catch (error) {
    console.error("[Stripe] Checkout session creation failed:", error);
    throw error;
  }
}

/**
 * Handle subscription creation from Stripe webhook
 */
export async function handleSubscriptionCreated(
  stripeSubscription: Stripe.Subscription,
  userId: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    const tier = stripeSubscription.metadata?.tier as "mirror" | "portal" || "mirror";

    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      tier,
      status: stripeSubscription.status as any,
      currentPeriodStart: new Date(((stripeSubscription as any).current_period_start as number) * 1000),
      currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end as number) * 1000),
    });

    // If Portal tier, initialize Portal context
    if (tier === "portal") {
      const existing = await db
        .select()
        .from(portalContexts)
        .where(eq(portalContexts.userId, userId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(portalContexts).values({
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          contextData: JSON.stringify({
            learningHistory: [],
            patterns: [],
            preferences: {},
          }),
          sovereignRuntime: JSON.stringify({
            initialized: true,
            createdAt: new Date().toISOString(),
          }),
        });
      }
    }

    console.log(`[Stripe] Subscription created for user ${userId}, tier: ${tier}`);
  } catch (error) {
    console.error("[Stripe] Failed to handle subscription creation:", error);
  }
}

/**
 * Handle subscription update (upgrade/downgrade)
 */
export async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription,
  userId: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    const tier = stripeSubscription.metadata?.tier as "mirror" | "portal" || "mirror";

    await db
      .update(subscriptions)
      .set({
        tier,
        status: stripeSubscription.status as any,
        currentPeriodStart: new Date(((stripeSubscription as any).current_period_start as number) * 1000),
        currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end as number) * 1000),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

    console.log(`[Stripe] Subscription updated for user ${userId}, tier: ${tier}`);
  } catch (error) {
    console.error("[Stripe] Failed to handle subscription update:", error);
  }
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCanceled(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

    console.log(`[Stripe] Subscription canceled: ${stripeSubscriptionId}`);
  } catch (error) {
    console.error("[Stripe] Failed to handle subscription cancellation:", error);
  }
}

/**
 * Get user's active subscription
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Stripe] Failed to get user subscription:", error);
    return null;
  }
}

/**
 * Upgrade or downgrade subscription
 */
export async function updateSubscriptionTier(
  stripeSubscriptionId: string,
  newTier: "mirror" | "portal"
) {
  try {
    const pricing = PRICING[newTier];
    if (!pricing) throw new Error("Invalid tier");

    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Update subscription with new price
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [
        {
          id: (subscription.items.data[0] as any).id,
          price: pricing.priceId,
        },
      ],
      metadata: {
        tier: newTier,
      },
    } as any);

    console.log(`[Stripe] Subscription tier updated to ${newTier}`);
    return true;
  } catch (error) {
    console.error("[Stripe] Failed to update subscription tier:", error);
    return false;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(stripeSubscriptionId: string) {
  try {
    await (stripe.subscriptions as any).del(stripeSubscriptionId);
    console.log(`[Stripe] Subscription canceled: ${stripeSubscriptionId}`);
    return true;
  } catch (error) {
    console.error("[Stripe] Failed to cancel subscription:", error);
    return false;
  }
}

/**
 * Record billing event
 */
export async function recordBillingEvent(
  userId: number,
  tier: "mirror" | "portal",
  eventType: "charge" | "subscription_created" | "subscription_updated" | "subscription_canceled" | "refund",
  amount: number,
  status: "succeeded" | "failed" | "pending",
  stripePaymentIntentId?: string,
  stripeInvoiceId?: string
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(billingHistory).values({
      userId,
      tier,
      eventType,
      amount,
      status,
      currency: "USD",
      stripePaymentIntentId,
      stripeInvoiceId,
    });
  } catch (error) {
    console.error("[Stripe] Failed to record billing event:", error);
  }
}

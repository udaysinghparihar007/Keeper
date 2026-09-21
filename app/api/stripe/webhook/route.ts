import Stripe from "stripe";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function toDate(seconds: number | null | undefined) {
  return seconds ? new Date(seconds * 1000) : null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    throw new Error("Stripe subscription is missing userId metadata");
  }

  const period = subscription.items.data[0];
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      providerCustomerId: String(subscription.customer),
      providerSubscriptionId: subscription.id,
      plan: "PRO",
      status: subscription.status.toUpperCase(),
      currentPeriodStart: toDate(period?.current_period_start),
      currentPeriodEnd: toDate(period?.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      providerCustomerId: String(subscription.customer),
      providerSubscriptionId: subscription.id,
      plan: "PRO",
      status: subscription.status.toUpperCase(),
      currentPeriodStart: toDate(period?.current_period_start),
      currentPeriodEnd: toDate(period?.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        if (checkout.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            String(checkout.subscription),
          );
          await syncSubscription(subscription);
        }
        break;
      }
      case "invoice.payment_failed":
        {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionReference =
            invoice.parent?.subscription_details?.subscription;
          if (subscriptionReference) {
            const subscription = await getStripe().subscriptions.retrieve(
              typeof subscriptionReference === "string"
                ? subscriptionReference
                : subscriptionReference.id,
            );
            await syncSubscription(subscription);
          }
        }
        break;
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

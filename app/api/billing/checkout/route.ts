import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStripe, getStripePriceId } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const body = (await request.json().catch(() => ({}))) as { returnPath?: string };
  const returnPath = body.returnPath?.startsWith("/") ? body.returnPath : "/account";
  const existing = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { providerCustomerId: true },
  });

  const stripe = getStripe();
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: getStripePriceId(), quantity: 1 }],
    customer: existing?.providerCustomerId ?? undefined,
    customer_email: existing?.providerCustomerId ? undefined : user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${origin}${returnPath}?checkout=success`,
    cancel_url: `${origin}${returnPath}?checkout=cancelled`,
  });

  return NextResponse.json({ url: checkout.url });
}

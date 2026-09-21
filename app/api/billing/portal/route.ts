import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { providerCustomerId: true },
  });
  if (!subscription?.providerCustomerId) {
    return NextResponse.json({ error: "No billing customer found" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const portal = await getStripe().billingPortal.sessions.create({
    customer: subscription.providerCustomerId,
    return_url: `${origin}/account`,
  });

  return NextResponse.json({ url: portal.url });
}

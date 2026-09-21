import prisma from "@/lib/prisma";

export const ENTITLEMENTS = {
  free: {
    canExportNotes: false,
    maxNotes: 100,
  },
  pro: {
    canExportNotes: true,
    maxNotes: 10_000,
  },
} as const;

const PAID_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export function isProSubscription(subscription: {
  plan: string;
  status: string;
}) {
  return subscription.plan === "PRO" && PAID_STATUSES.has(subscription.status);
}

export async function getEntitlements(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });
  const isPro = subscription ? isProSubscription(subscription) : false;

  return {
    plan: isPro ? "PRO" : "FREE",
    canExportNotes: isPro,
    maxNotes: isPro ? ENTITLEMENTS.pro.maxNotes : ENTITLEMENTS.free.maxNotes,
    subscription,
  };
}

export async function requireEntitlement(
  userId: string,
  entitlement: "canExportNotes",
) {
  const entitlements = await getEntitlements(userId);
  if (!entitlements[entitlement]) {
    throw new Error("PRO_ENTITLEMENT_REQUIRED");
  }
  return entitlements;
}

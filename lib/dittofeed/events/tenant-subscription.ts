import { createEvent } from "./send";
import { buildUserIdFromParts } from "../utils";

export const TENANT_SUB_EVENTS = {
  SubscriptionCreated: "TenantSubscriptionCreated",
  SubscriptionRenewalUpcoming: "TenantSubscriptionRenewalUpcoming",
  SubscriptionExpired: "TenantSubscriptionExpired",
  SubscriptionCancelled: "TenantSubscriptionCancelled",
  PaymentCompleted: "TenantPaymentCompleted",
  PaymentFailed: "TenantPaymentFailed",
  PlanChanged: "TenantPlanChanged",
  AutoRenewToggled: "TenantAutoRenewToggled",
  TrialWillEnd: "TenantTrialWillEnd",
};

type BaseProps = {
  tenantId?: string;
  tenantName?: string;
  planId?: string;
  planName?: string;
  billingPeriod?: "monthly" | "yearly";
  amount?: number;
  paymentMethod?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  renewalDate?: string;
  cancelledAt?: string;
  status?: string;
  autoRenew?: boolean;
  isTrial?: boolean;
  trialDays?: number | null;
  invoiceNo?: string;
  description?: string;
};

function uid(tenantId?: string, userId?: string) {
  return buildUserIdFromParts("users", tenantId || "platform", userId || "");
}

export const fireTenantSubscriptionCreated = createEvent(
  TENANT_SUB_EVENTS.SubscriptionCreated
);
export async function sendTenantSubscriptionCreated(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantSubscriptionCreated({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantSubscriptionRenewalUpcoming = createEvent(
  TENANT_SUB_EVENTS.SubscriptionRenewalUpcoming
);
export async function sendTenantSubscriptionRenewalUpcoming(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantSubscriptionRenewalUpcoming({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantSubscriptionExpired = createEvent(
  TENANT_SUB_EVENTS.SubscriptionExpired
);
export async function sendTenantSubscriptionExpired(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantSubscriptionExpired({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantSubscriptionCancelled = createEvent(
  TENANT_SUB_EVENTS.SubscriptionCancelled
);
export async function sendTenantSubscriptionCancelled(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantSubscriptionCancelled({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantPaymentCompleted = createEvent(
  TENANT_SUB_EVENTS.PaymentCompleted
);
export async function sendTenantPaymentCompleted(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantPaymentCompleted({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantPaymentFailed = createEvent(
  TENANT_SUB_EVENTS.PaymentFailed
);
export async function sendTenantPaymentFailed(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantPaymentFailed({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantPlanChanged = createEvent(
  TENANT_SUB_EVENTS.PlanChanged
);
export async function sendTenantPlanChanged(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantPlanChanged({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantAutoRenewToggled = createEvent(
  TENANT_SUB_EVENTS.AutoRenewToggled
);
export async function sendTenantAutoRenewToggled(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantAutoRenewToggled({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}

export const fireTenantTrialWillEnd = createEvent(
  TENANT_SUB_EVENTS.TrialWillEnd
);
export async function sendTenantTrialWillEnd(input: {
  tenantId?: string;
  userId?: string;
  props: BaseProps;
}) {
  return fireTenantTrialWillEnd({
    userId: uid(input.tenantId, input.userId),
    properties: input.props,
  });
}


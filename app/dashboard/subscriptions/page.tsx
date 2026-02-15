import { getTenantBillingData } from "@/lib/api/tenant-billing";
import SubscriptionsClient from "./subscriptions-client";

export default async function SubscriptionsPage() {
  const { subscription, payments, usage, tenantId } = await getTenantBillingData();
  return (
    <SubscriptionsClient
      subscription={subscription}
      payments={payments}
      usage={usage}
      tenantId={tenantId}
    />
  );
}


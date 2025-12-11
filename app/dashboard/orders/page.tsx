import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrdersData } from "@/lib/api/orders";
import OrdersClient from "./orders-client";

export const metadata = {
  title: "Siparişler",
};

export default async function OrdersPage() {
  const { orders, tenantId } = await getOrdersData();
  return (
    <div className="p-4 md:p-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <OrdersClient orders={orders} tenantId={tenantId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}


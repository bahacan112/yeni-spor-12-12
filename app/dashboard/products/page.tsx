import { Suspense } from "react";
import { getProductsData } from "@/lib/api/products";
import ProductsClient from "./products-client";

export const metadata = {
  title: "Ürünler",
  description: "Mağaza ürünleri yönetimi",
};

export default async function ProductsPage() {
  const { products, categories, tenantId } = await getProductsData();

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ProductsClient
        products={products}
        categories={categories}
        tenantId={tenantId}
      />
    </Suspense>
  );
}

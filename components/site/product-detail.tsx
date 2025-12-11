"use client";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";

export default function ProductDetail({
  product,
  slug,
}: {
  product: any;
  slug: string;
}) {
  const cart = useCartStore();
  const addToCart = () => {
    cart.addItem(product, undefined, 1);
    cart.setIsOpen(true);
  };
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-muted rounded-lg overflow-hidden">
        <div className="aspect-square">
          <img
            src={(Array.isArray(product.images) && product.images[0]) || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-primary font-bold text-xl mb-3">₺{product.price}</p>
        {product.description ? (
          <p className="text-sm text-muted-foreground mb-6">{product.description}</p>
        ) : null}
        <div className="flex gap-3">
          <Button onClick={addToCart}>Sepete Ekle</Button>
          <Button variant="outline" asChild>
            <a href={`/site/${slug}/sepet`}>Sepete Git</a>
          </Button>
        </div>
      </div>
    </div>
  );
}


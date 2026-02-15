"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import ImageUploader from "@/components/media/image-uploader";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product, ProductCategory } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ProductsClientProps {
  products: Product[];
  categories: ProductCategory[];
  tenantId: string;
}

export default function ProductsClient({
  products,
  categories,
  tenantId,
}: ProductsClientProps) {
  const [cats, setCats] = useState<ProductCategory[]>(categories);
  const [newCatName, setNewCatName] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<{
    name: string;
    price: string;
    stock: string;
    categoryId: string;
    description: string;
    isActive: boolean;
    images: string[];
  }>({
    name: "",
    price: "",
    stock: "",
    categoryId: "",
    description: "",
    isActive: true,
    images: [],
  });
  const supabase = createClient();
  const [hasEcommerceFeature, setHasEcommerceFeature] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tenant_subscriptions")
        .select("status, plan:platform_plans(features)")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      const features = (data as any)?.plan?.features || [];
      setHasEcommerceFeature(
        Array.isArray(features) ? features.includes("ecommerce") : true
      );
    })();
  }, [tenantId]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || p.categoryId === category;
    return matchesSearch && matchesCategory;
  });

  const stats = [
    { label: "Toplam Ürün", value: products.length, icon: Package },
    {
      label: "Aktif",
      value: products.filter((p) => p.isActive).length,
      icon: Eye,
    },
    {
      label: "Stokta Yok",
      value: products.filter((p) => p.stockQuantity === 0).length,
      icon: EyeOff,
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ürünler</h1>
          <p className="text-sm text-muted-foreground">
            Mağaza ürünlerini yönetin
          </p>
        </div>
        <Sheet open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              disabled={!hasEcommerceFeature}
              onClick={() => {
                setEditingProduct(null);
                setForm({
                  name: "",
                  price: "",
                  stock: "",
                  categoryId: cats[0]?.id || "",
                  description: "",
                  isActive: true,
                  images: [],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ürün Ekle
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[90vh] rounded-t-xl overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>
                {editingProduct ? "Ürün Düzenle" : "Yeni Ürün"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {!hasEcommerceFeature && (
                <Card className="bg-amber-900/20 border-amber-700">
                  <CardContent className="p-3 text-amber-200">
                    Paketiniz e-ticaret özelliğini içermiyor. Ürün
                    ekleyemezsiniz.
                  </CardContent>
                </Card>
              )}
              <div className="space-y-2">
                <Label>Ürün Görseli</Label>
                <ImageUploader
                  tenantId={tenantId}
                  folder="products"
                  value={form.images?.[0] || ""}
                  onChange={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      images: url ? [url] : [],
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Ürün Adı</Label>
                <Input
                  placeholder="Örn: Akademi Forma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fiyat (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stok</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    {cats.length === 0 && (
                      <SelectItem value="none" disabled>
                        Kategori bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Yeni kategori adı"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const name = newCatName.trim();
                        if (!name) return;
                        const { data, error } = await supabase
                          .from("product_categories")
                          .insert({
                            tenant_id: tenantId,
                            name,
                            slug: slugify(name),
                            sort_order: cats.length,
                            is_active: true,
                          })
                          .select("*")
                          .single();
                        if (!error && data) {
                          const newCat: ProductCategory = {
                            id: data.id,
                            tenantId: data.tenant_id,
                            name: data.name,
                            slug: data.slug,
                            description: data.description,
                            imageUrl: data.image_url,
                            parentId: data.parent_id,
                            sortOrder: data.sort_order,
                            isActive: data.is_active,
                            createdAt: data.created_at,
                          };
                          setCats((prev) => [...prev, newCat]);
                          setForm((prev) => ({
                            ...prev,
                            categoryId: newCat.id,
                          }));
                          setNewCatName("");
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const name = newCatName.trim();
                      if (!name) return;
                      const { data, error } = await supabase
                        .from("product_categories")
                        .insert({
                          tenant_id: tenantId,
                          name,
                          slug: slugify(name),
                          sort_order: cats.length,
                          is_active: true,
                        })
                        .select("*")
                        .single();
                      if (!error && data) {
                        const newCat: ProductCategory = {
                          id: data.id,
                          tenantId: data.tenant_id,
                          name: data.name,
                          slug: data.slug,
                          description: data.description,
                          imageUrl: data.image_url,
                          parentId: data.parent_id,
                          sortOrder: data.sort_order,
                          isActive: data.is_active,
                          createdAt: data.created_at,
                        };
                        setCats((prev) => [...prev, newCat]);
                        setForm((prev) => ({ ...prev, categoryId: newCat.id }));
                        setNewCatName("");
                      }
                    }}
                  >
                    Kategori Ekle
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beden Seçenekleri (Opsiyonel)</Label>
                <div className="flex flex-wrap gap-2">
                  {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                    <Button key={size} variant="outline" size="sm">
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  placeholder="Ürün açıklaması..."
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <div>
                  <p className="font-medium text-sm">Aktif</p>
                  <p className="text-xs text-muted-foreground">
                    Ürünü mağazada göster
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: !!v })}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  if (!form.name) return;
                  try {
                    if (editingProduct) {
                      const res = await fetch("/api/dashboard/products", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: editingProduct.id,
                          name: form.name,
                          price: form.price,
                          stock: form.stock,
                          categoryId: form.categoryId || null,
                          description: form.description,
                          images: Array.isArray(form.images) ? form.images : [],
                          isActive: form.isActive,
                        }),
                      });
                      if (!res.ok) return;
                    } else {
                      const res = await fetch("/api/dashboard/products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: form.name,
                          price: form.price,
                          stock: form.stock,
                          categoryId: form.categoryId || null,
                          description: form.description,
                          images: Array.isArray(form.images) ? form.images : [],
                          isActive: form.isActive,
                        }),
                      });
                      if (!res.ok) return;
                    }
                    setIsNewProductOpen(false);
                    location.reload();
                  } catch {}
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Ürünü Kaydet
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <stat.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            className="pl-9 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[130px] bg-card/50">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {cats.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products List */}
      <div className="space-y-2">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Ürün bulunamadı.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {product.category?.name || "Kategorisiz"}
                          </Badge>
                          {product.stockQuantity === 0 ? (
                            <Badge
                              variant="secondary"
                              className="bg-red-500/10 text-red-400 border-0 text-xs"
                            >
                              Stokta Yok
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {product.stockQuantity} adet
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProduct(product);
                              setForm({
                                name: product.name,
                                price: String(product.price),
                                stock: String(product.stockQuantity || 0),
                                categoryId: product.categoryId || "",
                                description: product.description || "",
                                isActive: product.isActive,
                                images: Array.isArray(product.images)
                                  ? product.images
                                  : [],
                              });
                              setIsNewProductOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              const { error } = await supabase
                                .from("products")
                                .update({ is_active: !product.isActive })
                                .eq("id", product.id);
                              if (!error) location.reload();
                            }}
                          >
                            {product.isActive ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Pasif Yap
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Aktif Yap
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={async () => {
                              const { error } = await supabase
                                .from("products")
                                .delete()
                                .eq("id", product.id);
                              if (!error) location.reload();
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-primary font-bold mt-1">
                      ₺{product.price}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

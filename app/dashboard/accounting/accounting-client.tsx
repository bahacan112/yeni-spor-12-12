"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Wallet,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Payment, Expense } from "@/lib/types";
import { AccountingStats } from "@/lib/api/accounting";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AccountingClientProps {
  payments: Payment[];
  expenses: Expense[];
  stats: AccountingStats;
  tenantId: string;
  branchId?: string;
}

export default function AccountingClient({
  payments,
  expenses,
  stats,
  tenantId,
  branchId,
}: AccountingClientProps) {
  const [filterType, setFilterType] = useState("all");
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );
  const supabase = createClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // Combine and sort transactions for the list
  const allTransactions = [
    ...payments.map((p) => ({
      ...p,
      type: "income" as const,
      date: p.paymentDate,
      category: p.paymentType,
    })),
    ...expenses.map((e) => ({
      ...e,
      type: "expense" as const,
      date: e.expenseDate,
      category: e.category,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  // Calculate expense categories for chart
  const expenseCategoriesMap = expenses.reduce(
    (acc, expense) => {
      const cat = expense.category || "Diğer";
      acc[cat] = (acc[cat] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalExpenses = stats.totalExpense || 1; // Avoid division by zero
  const expenseCategories = Object.entries(expenseCategoriesMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: Math.round((amount / totalExpenses) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);

  const statCards = [
    {
      label: "Toplam Gelir",
      value: `₺${stats.totalIncome.toLocaleString("tr-TR")}`,
      change: "Bu ay", // Placeholder logic
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Toplam Gider",
      value: `₺${stats.totalExpense.toLocaleString("tr-TR")}`,
      change: "Bu ay",
      trend: "up",
      icon: TrendingDown,
      color: "text-red-400",
    },
    {
      label: "Net Kar",
      value: `₺${stats.netProfit.toLocaleString("tr-TR")}`,
      change:
        ((stats.netProfit / (stats.totalIncome || 1)) * 100).toFixed(1) +
        "% Marj",
      trend: stats.netProfit >= 0 ? "up" : "down",
      icon: PiggyBank,
      color: "text-blue-400",
    },
    {
      label: "Bekleyen Ödeme",
      value: `₺${stats.pendingPayments.toLocaleString("tr-TR")}`,
      change: "Tahsil edilecek",
      trend: "neutral",
      icon: Wallet,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Muhasebe</h1>
            <p className="text-sm text-muted-foreground">
              Gelir gider takibi ve raporlar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-transparent"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  if (!branchId) {
                    toast.error("Önce bir şube seçin");
                    return;
                  }
                  const month = new Date().toISOString().slice(0, 7) + "-01";
                  const res = await fetch(
                    `/api/branches/${branchId}/recompute-dues`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ month }),
                    },
                  );
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Hesaplanamadı");
                  toast.success("Bu ay için aidatlar yeniden hesaplandı");
                } catch (e) {
                  console.error(e);
                  toast.error("Yeniden hesaplama sırasında hata oluştu");
                }
              }}
            >
              Yeniden Hesapla
            </Button>
            <Sheet
              open={isNewTransactionOpen}
              onOpenChange={setIsNewTransactionOpen}
            >
              <SheetTrigger asChild>
                <Button size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">İşlem Ekle</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Yeni İşlem</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {/* Transaction Type Tabs */}
                  <div className="flex gap-2">
                    <Button
                      variant={
                        transactionType === "income" ? "default" : "outline"
                      }
                      className={`flex-1 ${
                        transactionType === "income"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : ""
                      }`}
                      onClick={() => setTransactionType("income")}
                    >
                      <ArrowDownLeft className="h-4 w-4 mr-2" />
                      Gelir
                    </Button>
                    <Button
                      variant={
                        transactionType === "expense" ? "default" : "outline"
                      }
                      className={`flex-1 ${
                        transactionType === "expense"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }`}
                      onClick={() => setTransactionType("expense")}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Gider
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionType === "income" ? (
                          <>
                            <SelectItem value="dues">Aidat</SelectItem>
                            <SelectItem value="registration">
                              Kayıt Ücreti
                            </SelectItem>
                            <SelectItem value="product">Ürün Satışı</SelectItem>
                            <SelectItem value="other">Diğer</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="personel">Personel</SelectItem>
                            <SelectItem value="kira">Kira</SelectItem>
                            <SelectItem value="fatura">Fatura</SelectItem>
                            <SelectItem value="malzeme">Malzeme</SelectItem>
                            <SelectItem value="diger">Diğer</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tutar (₺)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tarih</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      placeholder="İşlem açıklaması..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={async () => {
                      if (!amount) {
                        toast.error("Tutar zorunlu");
                        return;
                      }
                      if (transactionType === "income") {
                        const { error } = await supabase
                          .from("payments")
                          .insert({
                            tenant_id: tenantId,
                            amount: Number(amount),
                            payment_type: category || "other",
                            payment_date: date,
                            description,
                          });
                        if (error) {
                          toast.error("Gelir kaydedilemedi");
                          return;
                        }
                      } else {
                        const { error } = await supabase
                          .from("expenses")
                          .insert({
                            tenant_id: tenantId,
                            amount: Number(amount),
                            category: category || "diger",
                            expense_date: date,
                            description,
                          });
                        if (error) {
                          toast.error("Gider kaydedilemedi");
                          return;
                        }
                      }
                      setIsNewTransactionOpen(false);
                      location.reload();
                    }}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    İşlemi Kaydet
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button variant="secondary" size="sm" className="shrink-0">
            <Calendar className="h-4 w-4 mr-1" />
            Tüm Zamanlar
          </Button>
          <Button variant="ghost" size="sm" className="shrink-0">
            Bu Hafta
          </Button>
          <Button variant="ghost" size="sm" className="shrink-0">
            Bu Ay
          </Button>
          <Button variant="ghost" size="sm" className="shrink-0">
            Bu Yıl
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg bg-background/50`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    stat.trend === "down"
                      ? "text-red-400 bg-red-400/10"
                      : "text-emerald-400 bg-emerald-400/10"
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-2">
                <p className="text-lg font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expense Breakdown */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Gider Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz gider kaydı bulunmuyor.
            </p>
          ) : (
            expenseCategories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {cat.name}
                  </span>
                  <span className="font-medium">
                    ₺{cat.amount.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Son İşlemler</CardTitle>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="income">Gelirler</SelectItem>
                <SelectItem value="expense">Giderler</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              İşlem bulunamadı.
            </p>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg ${
                    transaction.type === "income"
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {transaction.description || "Açıklama yok"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {transaction.type === "income"
                        ? transaction.category === "dues"
                          ? "Aidat"
                          : transaction.category === "registration"
                            ? "Kayıt Ücreti"
                            : transaction.category === "product"
                              ? "Ürün Satışı"
                              : "Diğer"
                        : transaction.category || "Diğer"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(transaction.date).toLocaleDateString("tr-TR")}
                    </span>
                    {transaction.type === "income" &&
                      transaction.student?.fullName && (
                        <>
                          <span>•</span>
                          <span>{transaction.student.fullName}</span>
                        </>
                      )}
                    {transaction.type === "income" &&
                      transaction.paymentMethod && (
                        <>
                          <span>•</span>
                          <span>
                            {transaction.paymentMethod === "cash"
                              ? "Nakit"
                              : transaction.paymentMethod === "credit_card"
                                ? "Kart"
                                : transaction.paymentMethod === "bank_transfer"
                                  ? "Havale"
                                  : transaction.paymentMethod}
                          </span>
                        </>
                      )}
                  </div>
                </div>
                <div
                  className={`font-semibold text-sm ${
                    transaction.type === "income"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}₺
                  {transaction.amount.toLocaleString("tr-TR")}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

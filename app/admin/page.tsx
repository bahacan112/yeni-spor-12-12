import {
  School,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  getAdminDashboardStats,
  getRecentTenants,
  getRecentPayments,
  getExpiringSubscriptions,
} from "@/lib/api/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.role !== "super_admin") {
    redirect("/dashboard");
  }

  const [stats, recentTenants, recentPayments, expiringSoon] =
    await Promise.all([
      getAdminDashboardStats(),
      getRecentTenants(),
      getRecentPayments(),
      getExpiringSubscriptions(),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400">Platform yönetim paneline hoş geldiniz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Toplam Okul</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalTenants}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+{stats.recentSignups} bu ay</span>
                </div>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-3">
                <School className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Aktif Abonelik</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeTenants}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{stats.expiredTenants} süresi dolmuş</span>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-3">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Aylık Gelir</p>
                <p className="text-2xl font-bold text-white">
                  {stats.monthlyRevenue.toLocaleString("tr-TR")} TL
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>+0% geçen aya göre</span>
                </div>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-3">
                <CreditCard className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalStudents.toLocaleString("tr-TR")}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Users className="h-3 w-3" />
                  <span>Tüm okullarda</span>
                </div>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-3">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Schools */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">
              Son Kayıt Olan Okullar
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-blue-400 hover:text-blue-300"
            >
              <Link href="/admin/schools">Tümünü Gör</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTenants.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-4">
                Henüz okul kaydı yok
              </div>
            ) : (
              recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className="text-white text-xs"
                        style={{ backgroundColor: tenant.primaryColor }}
                      >
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{tenant.name}</p>
                      <p className="text-xs text-slate-400">{tenant.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      tenant.subscriptionStatus === "active"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      tenant.subscriptionStatus === "active"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  >
                    {tenant.subscriptionStatus === "active"
                      ? "Aktif"
                      : "Süresi Dolmuş"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">
              Son Ödemeler
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-blue-400 hover:text-blue-300"
            >
              <Link href="/admin/payments">Tümünü Gör</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-4">
                Henüz ödeme yok
              </div>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/20 p-2">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {payment.tenant?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {payment.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">
                      +{payment.amount.toLocaleString("tr-TR")} TL
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(payment.paidAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expiring Subscriptions */}
        <Card className="border-slate-800 bg-slate-900 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                Süresi Yaklaşan Abonelikler
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringSoon.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                Yaklaşan abonelik süresi bulunmuyor
              </div>
            ) : (
              <div className="space-y-3">
                {expiringSoon.map((sub) => {
                  const daysLeft = Math.ceil(
                    (new Date(sub.currentPeriodEnd).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg bg-amber-500/10 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            className="text-white text-xs"
                            style={{
                              backgroundColor: sub.tenant?.primaryColor,
                            }}
                          >
                            {sub.tenant?.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">
                            {sub.tenant?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {sub.plan?.name} -{" "}
                            {sub.billingPeriod === "monthly"
                              ? "Aylık"
                              : "Yıllık"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-amber-500/20 text-amber-400">
                          {daysLeft} gün kaldı
                        </Badge>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString(
                            "tr-TR"
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

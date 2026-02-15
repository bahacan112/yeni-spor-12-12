import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import DittofeedClient from "./dittofeed-client";
import {
  getAllTenants,
  getAllSubscriptions,
  getAllPayments,
  getAllNotifications,
} from "@/lib/api/admin";

export default async function AdminDittofeedPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") redirect("/dashboard");
  const [tenants, subscriptions, payments, notifications] = await Promise.all([
    getAllTenants(),
    getAllSubscriptions(),
    getAllPayments(),
    getAllNotifications(),
  ]);
  return (
    <DittofeedClient
      tenants={tenants}
      subscriptions={subscriptions}
      payments={payments}
      notifications={notifications}
    />
  );
}

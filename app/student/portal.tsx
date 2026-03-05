import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function StudentPortal({
  expectedTenantId,
  loginHref,
}: {
  expectedTenantId?: string;
  loginHref?: string;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginHref || "/auth/login");

  const { data: stu } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!stu) {
    return (
      <div className="min-h-screen bg-background p-0">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">Öğrenci kaydı bulunamadı</p>
        </div>
      </div>
    );
  }

  if (expectedTenantId && String(stu.tenant_id || "") !== String(expectedTenantId)) {
    return (
      <div className="min-h-screen bg-background p-0">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">Yetkisiz</p>
        </div>
      </div>
    );
  }

  const studentId = stu.id;
  const { data: duesRaw } = await supabase
    .from("monthly_dues")
    .select("*")
    .eq("student_id", studentId)
    .order("due_month", { ascending: false })
    .limit(12);
  const { data: paymentsRaw } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false })
    .limit(20);
  const { data: attRaw } = await supabase
    .from("attendance")
    .select("training_id,status,marked_at")
    .eq("student_id", studentId)
    .order("marked_at", { ascending: false })
    .limit(50);

  const dues = (duesRaw || []).map((d: any) => ({
    id: d.id,
    dueMonth: d.due_month,
    amount: Number(d.computed_amount ?? d.amount ?? 0),
    paidAmount: Number(d.paid_amount ?? 0),
    status: d.status,
    dueDate: d.due_date,
  }));
  const payments = (paymentsRaw || []).map((p: any) => ({
    id: p.id,
    amount: Number(p.amount || 0),
    method: p.payment_method || "-",
    date: p.payment_date,
    type: p.payment_type,
  }));
  const attendance = (attRaw || []).map((a: any) => ({
    trainingId: a.training_id,
    status: a.status,
    markedAt: a.marked_at,
  }));

  return (
    <div className="min-h-screen bg-background p-0">
      <header className="bg-background border-b border-border">
        <div className="px-0 py-3">
          <h1 className="text-lg font-bold">{stu.full_name}</h1>
          <p className="text-xs text-muted-foreground">{stu.email || "-"}</p>
        </div>
      </header>

      <main className="px-0 py-2 space-y-2">
        <Card className="rounded-none bg-card/50 border-border/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Aylık Aidat Dönemleri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {dues.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between px-4 py-3 border-t border-border/50"
                >
                  <span className="text-sm">
                    {new Date(d.dueMonth).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {d.amount.toLocaleString("tr-TR")} TL
                    </span>
                    <Badge variant="outline" className="rounded-none text-xs">
                      {d.status}
                    </Badge>
                  </div>
                </li>
              ))}
              {dues.length === 0 && (
                <li className="px-4 py-3 text-muted-foreground text-sm">
                  Kayıt yok
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-none bg-card/50 border-border/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Ödeme Geçmişi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 border-t border-border/50"
                >
                  <span className="text-sm">
                    {new Date(p.date).toLocaleDateString("tr-TR")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {p.amount.toLocaleString("tr-TR")} TL
                    </span>
                    <Badge variant="outline" className="rounded-none text-xs">
                      {p.method}
                    </Badge>
                  </div>
                </li>
              ))}
              {payments.length === 0 && (
                <li className="px-4 py-3 text-muted-foreground text-sm">
                  Kayıt yok
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-none bg-card/50 border-border/50">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Yoklama</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {attendance.map((a, idx) => (
                <li
                  key={`${a.trainingId}-${idx}`}
                  className="flex items-center justify-between px-4 py-3 border-t border-border/50"
                >
                  <span className="text-sm">{a.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.markedAt ? new Date(a.markedAt).toLocaleString("tr-TR") : "-"}
                  </span>
                </li>
              ))}
              {attendance.length === 0 && (
                <li className="px-4 py-3 text-muted-foreground text-sm">
                  Kayıt yok
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

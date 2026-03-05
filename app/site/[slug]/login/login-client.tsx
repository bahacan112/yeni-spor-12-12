"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSupabaseClient } from "@/lib/supabase/client";
import { tenantScopedAuthEmailBrowser } from "@/lib/auth/tenant-auth-email-browser";

export function SiteLoginClient({
  tenantId,
  slug,
}: {
  tenantId: string;
  slug: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const authEmail = await tenantScopedAuthEmailBrowser(tenantId, email);
      let res = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });
      if (res.error) {
        const msg = String(res.error.message || "").toLowerCase();
        const isBadCred =
          msg.includes("invalid login credentials") || msg.includes("invalid");
        if (!isBadCred) throw res.error;
        res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) throw res.error;
      }

      const mustChange = Boolean(
        (res.data.user as any)?.user_metadata?.must_change_password,
      );
      if (mustChange) {
        router.refresh();
        router.push("/dashboard/force-password");
        return;
      }

      let role = "";
      let userTenantId = "";
      if (res.data.user) {
        const { data: userRow } = await supabase
          .from("users")
          .select("role,tenant_id")
          .eq("id", res.data.user.id)
          .maybeSingle();
        role = String((userRow as any)?.role || "");
        userTenantId = String((userRow as any)?.tenant_id || "");
      }

      if (role !== "student" || userTenantId !== tenantId) {
        await supabase.auth.signOut();
        throw new Error("Bu okul için öğrenci girişi yapılamadı.");
      }

      router.refresh();
      router.push(`/site/${slug}/student`);
    } catch (err: any) {
      setError(err?.message || "Giriş yapılırken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Öğrenci Girişi</CardTitle>
        <CardDescription className="text-slate-400">
          {slug} öğrencileri için giriş
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-900/50 border-red-900 text-white"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              E-posta
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="ornek@akademi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Şifre
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              <>
                Giriş Yap
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

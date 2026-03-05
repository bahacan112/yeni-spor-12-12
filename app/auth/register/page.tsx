"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSupabaseClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

const plans = [
  { id: "plan-trial", name: "Deneme - 14 gün ücretsiz" },
  { id: "plan-starter", name: "Başlangıç - ₺999/ay" },
  { id: "plan-professional", name: "Profesyonel - ₺1,999/ay" },
  { id: "plan-enterprise", name: "Kurumsal - ₺4,999/ay" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    plan: "plan-trial",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!formData.schoolName || !formData.fullName || !formData.phone) {
        setError("Lütfen tüm alanları doldurun.");
        return;
      }
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      // 1. Register User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "tenant_admin",
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create Tenant (Ideally this should be a Postgres Trigger or Edge Function for security,
        // but for now we'll do it client-side if RLS allows, or via a special RPC function)

        // Since we are doing it client side, we rely on the trigger we created earlier
        // (handle_new_user) to create the user record.
        // However, we need to create the TENANT record and link them.

        // IMPORTANT: In a real production app, you should call a secure API endpoint
        // (Next.js API Route) to create the tenant and link the user to prevent tampering.
        // For this demo, we will assume we have an RPC function or we call an API route.

        // Let's call a Next.js API route to handle the tenant creation securely
        const res = await fetch("/api/auth/register-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authData.user.id,
            schoolName: formData.schoolName,
            slug: slugify(formData.schoolName),
            email: formData.email,
            phone: formData.phone,
            planId: formData.plan,
            fullName: formData.fullName, // Ensure this is passed
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Okul kaydı oluşturulamadı.");
        }

        // Redirect to verification or dashboard
        router.push(
          "/auth/verify-email?email=" + encodeURIComponent(formData.email)
        );
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Kayıt işlemi sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
        </div>
        <CardTitle className="text-2xl text-white">Kayıt Ol</CardTitle>
        <CardDescription className="text-slate-400">
          {step === 1
            ? "Okul bilgilerinizi girin"
            : "Hesap bilgilerinizi tamamlayın"}
        </CardDescription>
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            className={`h-2 w-16 rounded-full ${
              step >= 1 ? "bg-blue-500" : "bg-slate-700"
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full ${
              step >= 2 ? "bg-blue-500" : "bg-slate-700"
            }`}
          />
        </div>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-slate-300">
                  Okul / Akademi Adı
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="schoolName"
                    placeholder="Örn: Altınşehir Spor Akademisi"
                    value={formData.schoolName}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolName: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  Ad Soyad
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fullName"
                    placeholder="Yönetici adı soyadı"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  Telefon
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0532 123 4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="text-slate-300">
                  Paket Seçin
                </Label>
                <Select
                  value={formData.plan}
                  onValueChange={(v) => setFormData({ ...formData, plan: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
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
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
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
                    placeholder="En az 8 karakter"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white"
                    required
                    minLength={8}
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Şifre Tekrar
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Şifrenizi tekrar girin"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    required
                    data-lpignore="true"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptTerms: e.target.checked })
                  }
                  className="mt-1 rounded border-slate-700 bg-slate-800"
                  required
                />
                <label htmlFor="terms" className="text-sm text-slate-400">
                  <Link
                    href="/terms"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Kullanım şartlarını
                  </Link>{" "}
                  ve{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    gizlilik politikasını
                  </Link>{" "}
                  kabul ediyorum.
                </label>
              </div>
            </>
          )}

          <div className="flex gap-3">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-slate-700 text-slate-300 bg-transparent"
              >
                Geri
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : step === 1 ? (
                <>
                  Devam Et
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Kayıt Ol
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Zaten hesabınız var mı?{" "}
          <Link
            href="/auth/login"
            className="text-blue-500 hover:text-blue-400"
          >
            Giriş Yap
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

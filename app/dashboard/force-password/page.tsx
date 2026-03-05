"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ForcePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }
      const must = Boolean((data.user as any)?.user_metadata?.must_change_password);
      if (!must) {
        const { data: userRow } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        const role = String((userRow as any)?.role || "");
        if (role === "super_admin") router.push("/admin");
        else if (role === "instructor") router.push("/instructor");
        else if (role === "student") router.push("/student");
        else router.push("/dashboard");
      }
    };
    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setIsLoading(true);
    const { error: e2 } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    } as any);
    setIsLoading(false);
    if (e2) {
      setError("Şifre güncellenemedi.");
      return;
    }
    router.refresh();
    const { data: u2 } = await supabase.auth.getUser();
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", u2.user?.id || "")
      .maybeSingle();
    const role = String((userRow as any)?.role || "");
    if (role === "super_admin") router.push("/admin");
    else if (role === "instructor") router.push("/instructor");
    else if (role === "student") router.push("/student");
    else router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Şifre Belirle</CardTitle>
        <CardDescription className="text-slate-400">
          İlk giriş için yeni şifre belirlemeniz gerekiyor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Yeni Şifre
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="En az 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white"
                required
                minLength={8}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                Şifreyi Kaydet
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


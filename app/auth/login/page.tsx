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
  ArrowRight,
  Loader2,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<"school" | "instructor">("school");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        throw authError;
      }

      // Check user role for redirection
      let userRole = null;
      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();
        userRole = userData?.role;
      }

      router.refresh();

      if (userRole === "super_admin") {
        router.push("/admin");
        return;
      }

      if (loginType === "school") {
        router.push("/dashboard");
      } else {
        router.push("/instructor");
      }
    } catch (err: any) {
      setError(err.message || "Giriş yapılırken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Giriş Yap</CardTitle>
        <CardDescription className="text-slate-400">
          Hesabınıza giriş yapın
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={loginType}
          onValueChange={(v) => setLoginType(v as "school" | "instructor")}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger
              value="school"
              className="data-[state=active]:bg-blue-600"
            >
              Okul Girişi
            </TabsTrigger>
            <TabsTrigger
              value="instructor"
              className="data-[state=active]:bg-emerald-600"
            >
              Eğitmen Girişi
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
              {loginType === "school" ? "E-posta" : "Kullanıcı Adı"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type={loginType === "school" ? "email" : "text"}
                placeholder={
                  loginType === "school" ? "ornek@akademi.com" : "kullanici.adi"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-300">
                Şifre
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Şifremi Unuttum
              </Link>
            </div>
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

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              loginType === "school"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
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

        {loginType === "school" && (
          <p className="mt-6 text-center text-sm text-slate-400">
            Hesabınız yok mu?{" "}
            <Link
              href="/auth/register"
              className="text-blue-500 hover:text-blue-400"
            >
              Kayıt Ol
            </Link>
          </p>
        )}

        {loginType === "instructor" && (
          <p className="mt-6 text-center text-sm text-slate-400">
            Giriş bilgilerinizi okul yöneticinizden alabilirsiniz.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { getSupabaseClient } from "@/lib/supabase/client"

export default function LogoutPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const logout = async () => {
      try {
        const supabase = getSupabaseClient()
        await supabase.auth.signOut()

        // Clear cookies and session
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // Clear localStorage
        localStorage.clear()

        // Clear sessionStorage
        sessionStorage.clear()
        
      } catch (error) {
        console.error("Logout error:", error)
      } finally {
        setIsLoggingOut(false)
        setIsComplete(true)
      }
    }

    logout()
  }, [])

  if (isLoggingOut) {
    return (
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardContent className="pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Çıkış Yapılıyor...</h2>
          <p className="text-slate-400">Oturumunuz güvenli bir şekilde sonlandırılıyor.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardContent className="pt-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Çıkış Yapıldı</h2>
        <p className="text-slate-400 mb-6">
          Oturumunuz başarıyla sonlandırıldı. Tüm çerezler ve oturum verileri temizlendi.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <LogOut className="mr-2 h-4 w-4" />
              Tekrar Giriş Yap
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 bg-transparent">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

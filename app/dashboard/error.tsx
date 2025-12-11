"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error)
  }, [error])

  const isTenantError = error.message === "Tenant not found" || error.message.includes("Tenant")

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {isTenantError ? "Okul Kaydı Bulunamadı" : "Dashboard Hatası"}
        </h2>
        <p className="text-gray-400 mb-6">
          {isTenantError 
            ? "Hesabınıza bağlı bir okul/tenant bulunamadı. Lütfen giriş yapıp tekrar deneyin veya destek ile iletişime geçin."
            : "Dashboard yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."
          }
        </p>

        <div className="flex gap-3 justify-center">
          {!isTenantError && (
            <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
          )}
          
          <Button asChild variant="outline" className="border-gray-700 bg-transparent text-white hover:bg-slate-800">
            <Link href="/auth/logout">
              Çıkış Yap
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

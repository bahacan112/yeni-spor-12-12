"use client"

import { useEffect } from "react"
import { ShieldAlert, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin Panel Error:", error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Admin Panel Hatası</h2>
        <p className="text-gray-400 mb-6">Yönetim paneli yüklenirken bir hata oluştu.</p>

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tekrar Dene
          </Button>
          <Button asChild variant="outline" className="border-gray-700 bg-transparent">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Admin Ana Sayfa
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

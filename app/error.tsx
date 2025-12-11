"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw, ArrowLeft, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Page Error:", error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Bir Sorun Oluştu</h2>
          <p className="text-gray-400">Bu sayfayı yüklerken bir hata oluştu. Lütfen tekrar deneyin.</p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
                <Bug className="w-3 h-3" />
                Development Error
              </div>
              <p className="text-amber-300 text-xs font-mono break-all">{error.message}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tekrar Dene
          </Button>
          <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard'a Dön
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

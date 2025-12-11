"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error:", error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-[#0a1628]">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Bir Hata Oluştu</h1>
              <p className="text-gray-400 mb-4">
                Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                  <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                    <Bug className="w-4 h-4" />
                    Hata Detayları (Development)
                  </div>
                  <p className="text-red-300 text-sm font-mono break-all">{error.message}</p>
                  {error.digest && <p className="text-red-400/60 text-xs mt-2">Digest: {error.digest}</p>}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Sorun devam ederse{" "}
                <a href="mailto:destek@sportmanager.com" className="text-blue-400 hover:underline">
                  destek@sportmanager.com
                </a>{" "}
                adresinden bize ulaşın.
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="fixed top-20 left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </body>
    </html>
  )
}

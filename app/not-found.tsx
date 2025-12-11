import Link from "next/link"
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-[#1e3a5f] leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
              <Search className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-white mb-2">Sayfa Bulunamadı</h1>
        <p className="text-gray-400 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. URL'yi kontrol edin veya aşağıdaki seçeneklerden birini
          kullanın.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Help Link */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Yardım merkezi
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-20 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  )
}

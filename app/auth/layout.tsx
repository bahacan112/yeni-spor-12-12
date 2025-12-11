import type React from "react"
import { Dumbbell } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SporYonetim</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-500">© 2025 SporYonetim. Tüm hakları saklıdır.</footer>
    </div>
  )
}

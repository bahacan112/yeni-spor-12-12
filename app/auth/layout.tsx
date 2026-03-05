import type React from "react"
import { Dumbbell } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-500">© 2025 Tüm hakları saklıdır.</footer>
    </div>
  )
}

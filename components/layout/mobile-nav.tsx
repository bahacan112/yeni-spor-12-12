"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, CreditCard, Wallet, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Ana Sayfa",
  },
  {
    href: "/dashboard/students",
    icon: Users,
    label: "Öğrenciler",
  },
  {
    href: "/dashboard/dues",
    icon: CreditCard,
    label: "Aidatlar",
  },
  {
    href: "/dashboard/accounting",
    icon: Wallet,
    label: "Muhasebe",
  },
  {
    href: "/dashboard/more",
    icon: MoreHorizontal,
    label: "Daha Fazla",
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 lg:hidden safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors",
                isActive ? "text-blue-400" : "text-slate-400 hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-blue-400")} />
              <span className={cn("font-medium", isActive && "text-blue-400")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

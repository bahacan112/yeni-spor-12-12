"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  Settings,
  LayoutDashboard,
  Package,
  FileText,
  ChevronLeft,
  Menu,
  LogOut,
  School,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: School, label: "Okullar", href: "/admin/schools" },
  { icon: RefreshCw, label: "Abonelikler", href: "/admin/subscriptions" },
  { icon: Package, label: "Paketler", href: "/admin/plans" },
  { icon: CreditCard, label: "Ödemeler", href: "/admin/payments" },
  { icon: Bell, label: "Bildirimler", href: "/admin/notifications" },
  { icon: FileText, label: "Raporlar", href: "/admin/reports" },
  { icon: Users, label: "Kullanıcılar", href: "/admin/users" },
  { icon: Settings, label: "Ayarlar", href: "/admin/settings" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-white">Admin Panel</span>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-600 text-white text-xs">SA</AvatarFallback>
        </Avatar>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-white">Admin Panel</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-slate-400 hover:text-white md:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-800 p-2">
          <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", sidebarCollapsed && "justify-center")}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-600 text-white text-xs">SA</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">Super Admin</p>
                <p className="truncate text-xs text-slate-400">admin@platform.com</p>
              </div>
            )}
          </div>
          <Link
            href="/auth/logout"
            className={cn(
              "mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white",
              sidebarCollapsed && "justify-center",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>Çıkış Yap</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn("flex-1 pt-14 transition-all duration-300 md:pt-0", sidebarCollapsed ? "md:pl-16" : "md:pl-64")}
      >
        <div className="min-h-screen p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}

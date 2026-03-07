"use client"

import Link from "next/link"
import {
  GraduationCap,
  Layers,
  MapPin,
  FileText,
  Link2,
  ShoppingBag,
  Globe,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  CreditCard,
  Building2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const menuGroups = [
  {
    title: "Yönetim",
    items: [
      { href: "/dashboard/instructors", icon: GraduationCap, label: "Eğitmenler", color: "text-purple-500" },
      { href: "/dashboard/groups", icon: Layers, label: "Gruplar", color: "text-teal-500" },
      { href: "/dashboard/venues", icon: MapPin, label: "Sahalar", color: "text-red-500" },
      { href: "/dashboard/branches", icon: Building2, label: "Şubeler", color: "text-indigo-500" },
    ],
  },
  {
    title: "Finans",
    items: [
      { href: "/dashboard/dues", icon: CreditCard, label: "Aidat Takibi", color: "text-emerald-500" },
      { href: "/dashboard/applications", icon: FileText, label: "Başvurular", color: "text-green-500" },
      { href: "/dashboard/registration-links", icon: Link2, label: "Kayıt Linkleri", color: "text-blue-500" },
    ],
  },
  {
    title: "İletişim",
    items: [{ href: "/dashboard/notifications", icon: Bell, label: "Bildirimler", color: "text-amber-500" }],
  },
  {
    title: "Web Sitesi",
    items: [
      { href: "/dashboard/products", icon: ShoppingBag, label: "Ürünler", color: "text-orange-500" },
      { href: "/dashboard/website", icon: Globe, label: "Site Yönetimi", color: "text-cyan-500" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/dashboard/settings", icon: Settings, label: "Ayarlar", color: "text-gray-400" },
      { href: "/help", icon: HelpCircle, label: "Yardım", color: "text-yellow-500" },
    ],
  },
]

export default function MorePage() {
  return (
    <div className="flex flex-col gap-6 p-4 pb-20">
      <div>
        <h1 className="text-xl font-bold text-foreground">Daha Fazla</h1>
        <p className="text-sm text-muted-foreground">Tüm menü seçenekleri</p>
      </div>

      {menuGroups.map((group) => (
        <div key={group.title}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">{group.title}</h2>
          <Card className="bg-card border-border">
            <CardContent className="divide-y divide-border p-0">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/50"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Logout */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Link 
            href="/auth/logout" 
            className="flex w-full items-center gap-4 px-4 py-3.5 text-destructive transition-colors hover:bg-destructive/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="font-medium">Çıkış Yap</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

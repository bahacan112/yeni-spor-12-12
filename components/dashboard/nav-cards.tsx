"use client"

import Link from "next/link"
import { Users, GraduationCap, Layers, Calendar, MapPin, Wallet, FileText, Link2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const navItems = [
  { href: "/dashboard/students", icon: Users, label: "Öğrenciler", color: "text-amber-500", bg: "bg-amber-500/20" },
  {
    href: "/dashboard/instructors",
    icon: GraduationCap,
    label: "Eğitmenler",
    color: "text-purple-500",
    bg: "bg-purple-500/20",
  },
  { href: "/dashboard/groups", icon: Layers, label: "Gruplar", color: "text-teal-500", bg: "bg-teal-500/20" },
  {
    href: "/dashboard/trainings",
    icon: Calendar,
    label: "Antremanlar",
    color: "text-pink-500",
    bg: "bg-pink-500/20",
  },
  { href: "/dashboard/venues", icon: MapPin, label: "Sahalar", color: "text-red-500", bg: "bg-red-500/20" },
  { href: "/dashboard/accounting", icon: Wallet, label: "Muhasebe", color: "text-green-500", bg: "bg-green-500/20" },
  {
    href: "/dashboard/applications",
    icon: FileText,
    label: "Başvurular",
    color: "text-emerald-500",
    bg: "bg-emerald-500/20",
  },
  {
    href: "/dashboard/registration-links",
    icon: Link2,
    label: "Kayıt Linkleri",
    color: "text-blue-500",
    bg: "bg-blue-500/20",
  },
]

export function NavCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:bg-secondary/50">
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

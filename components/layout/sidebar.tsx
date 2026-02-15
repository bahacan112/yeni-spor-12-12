"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  Users,
  GraduationCap,
  Layers,
  Calendar,
  MapPin,
  Wallet,
  FileText,
  Link2,
  ShoppingBag,
  Globe,
  Settings,
  Bell,
  CreditCard,
  Building2,
  Trophy,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/stores/app-store";
import { Tenant } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useEffect, useState } from "react";

const menuItems = [
  {
    title: "Genel Yönetim",
    items: [
      { href: "/dashboard", icon: Home, label: "Ana Sayfa" },
      { href: "/dashboard/branches", icon: Building2, label: "Şubeler" },
      {
        href: "/dashboard/instructors",
        icon: GraduationCap,
        label: "Eğitmenler",
      },
      { href: "/dashboard/venues", icon: MapPin, label: "Sahalar" },
      { href: "/dashboard/applications", icon: FileText, label: "Başvurular" },
      {
        href: "/dashboard/registration-links",
        icon: Link2,
        label: "Kayıt Linkleri",
      },
      {
        href: "/dashboard/general-accounting",
        icon: BarChart3,
        label: "Genel Muhasebe",
      },
      { href: "/dashboard/reports", icon: BarChart3, label: "Raporlar" },
      { href: "/dashboard/subscriptions", icon: CreditCard, label: "Abonelik" },
      { href: "/dashboard/notifications", icon: Bell, label: "Bildirimler" },
      { href: "/dashboard/settings", icon: Settings, label: "Ayarlar" },
    ],
  },
  {
    title: "Şube Yönetimi",
    items: [
      { href: "/dashboard/students", icon: Users, label: "Öğrenciler" },
      { href: "/dashboard/sports", icon: Trophy, label: "Branşlar" },
      { href: "/dashboard/groups", icon: Layers, label: "Gruplar" },
      { href: "/dashboard/trainings", icon: Calendar, label: "Antrenmanlar" },
      { href: "/dashboard/calendar", icon: Calendar, label: "Takvim" },
      { href: "/dashboard/dues", icon: CreditCard, label: "Aidat Takibi" },
      { href: "/dashboard/accounting", icon: Wallet, label: "Muhasebe" },
      {
        href: "/dashboard/payment-history",
        icon: CreditCard,
        label: "Ödeme Geçmişi",
      },
      {
        href: "/dashboard/accounting/policy",
        icon: Settings,
        label: "Aidat Politikası",
      },
    ],
  },
  {
    title: "Web Sitesi",
    items: [
      { href: "/dashboard/website", icon: Globe, label: "Site Yönetimi" },
      { href: "/dashboard/products", icon: ShoppingBag, label: "Ürünler" },
      { href: "/dashboard/orders", icon: CreditCard, label: "Siparişler" },
    ],
  },
];

interface SidebarProps {
  tenantName?: string;
}

export function Sidebar({ tenantName }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { currentBranch } = useAuthStore();
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((sec) => {
      const key = `sidebar.open.${sec.title}`;
      const val =
        typeof window !== "undefined" ? localStorage.getItem(key) : null;
      initial[sec.title] = val === null ? true : val === "true";
    });
    setSectionOpen(initial);
  }, []);

  const toggleSection = (title: string) => {
    setSectionOpen((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      if (typeof window !== "undefined") {
        localStorage.setItem(`sidebar.open.${title}`, String(next[title]));
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">SA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {tenantName || "Spor Okulu"}
              </span>
              <span className="text-xs text-slate-400">Yönetim Paneli</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="flex flex-col gap-2 p-4">
            {menuItems.map((section) => {
              const isSecActive = section.items.some((it) =>
                pathname.startsWith(it.href)
              );
              const open = sectionOpen[section.title] ?? true;
              return (
                <div key={section.title} className="mb-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors text-slate-500 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <span>{section.title}</span>
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div
                    className={cn(
                      "flex flex-col gap-1 overflow-hidden transition-all duration-300",
                      open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {section.items.map((item) => {
                      const hasChild = section.items.some(
                        (it) =>
                          it.href !== item.href &&
                          it.href.startsWith(item.href + "/")
                      );
                      const isActive =
                        pathname === item.href ||
                        (!hasChild &&
                          item.href !== "/dashboard" &&
                          pathname.startsWith(item.href));
                      const Icon = item.icon;
                      const noBranchPaths = [
                        "/dashboard/website",
                        "/dashboard/products",
                        "/dashboard/orders",
                        "/dashboard/general-accounting",
                        "/dashboard/subscriptions",
                      ];
                      const nextHref =
                        currentBranch && !noBranchPaths.includes(item.href)
                          ? `${item.href}?branch=${currentBranch.id}`
                          : item.href;

                      return (
                        <Link
                          key={item.href}
                          href={nextHref}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                            isActive
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}

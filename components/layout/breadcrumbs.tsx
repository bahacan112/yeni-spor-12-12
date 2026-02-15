"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Öğrenciler",
  groups: "Gruplar",
  venues: "Sahalar",
  applications: "Başvurular",
  "registration-links": "Kayıt Linkleri",
  dues: "Aidat Takibi",
  notifications: "Bildirimler",
  settings: "Ayarlar",
  trainings: "Antrenmanlar",
  calendar: "Takvim",
  accounting: "Muhasebe",
  "payment-history": "Ödeme Geçmişi",
  website: "Site Yönetimi",
  products: "Ürünler",
  orders: "Siparişler",
  admin: "Admin",
  schools: "Okullar",
  subscriptions: "Abonelikler",
  plans: "Paketler",
  payments: "Ödemeler",
  reports: "Raporlar",
  users: "Kullanıcılar",
  instructor: "Eğitmen",
  attendance: "Yoklama",
  analytics: "Öğrenci Analizi",
  sports: "Branşlar",
};

function isIdLike(segment: string) {
  if (!segment) return false;
  if (/^\d+$/.test(segment)) return true;
  if (/^[a-f0-9]{10,}$/i.test(segment)) return true;
  return false;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((_, idx) => {
    const fullPath = "/" + segments.slice(0, idx + 1).join("/");
    const seg = segments[idx];
    const label =
      LABELS[seg] ||
      (isIdLike(seg) ? "Detay" : seg.charAt(0).toUpperCase() + seg.slice(1));
    return { path: fullPath, label };
  });

  return (
    <Breadcrumb className={cn("px-4 py-3", className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Ana Sayfa</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.length > 0 && <BreadcrumbSeparator />}
        {items.map((item, idx) =>
          idx === items.length - 1 ? (
            <BreadcrumbItem key={item.path}>
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <Fragment key={item.path}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={item.path}>{item.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

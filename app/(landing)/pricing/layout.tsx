import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "Spor okulunuzun büyüklüğüne ve ihtiyaçlarına en uygun paketi seçin. Şeffaf fiyatlandırma, gizli ücret veya sürpriz maliyet yok.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type React from "react"
import { LandingHeader } from "@/components/landing/header"
import { LandingFooter } from "@/components/landing/footer"

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <LandingHeader />
      <main className="pt-16">{children}</main>
      <LandingFooter />
    </div>
  )
}

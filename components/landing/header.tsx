"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/features", label: "Özellikler" },
  { href: "/pricing", label: "Fiyatlar" },
  { href: "/about", label: "Hakkımızda" },
]

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SporYonetim</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
              Giriş Yap
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              Ücretsiz Başla
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn("md:hidden overflow-hidden transition-all duration-300", mobileMenuOpen ? "max-h-96" : "max-h-0")}
      >
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 bg-transparent">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/auth/register" className="block">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">Ücretsiz Başla</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

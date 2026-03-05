import Link from "next/link"
import { Dumbbell, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

const footerLinks = {
  product: [
    { label: "Özellikler", href: "/features" },
    { label: "Fiyatlandırma", href: "/pricing" },
    { label: "Demo Talep Et", href: "/demo" },
    { label: "API", href: "/api" },
  ],
  company: [
    { label: "Hakkımızda", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Kariyer", href: "/careers" },
    { label: "İletişim", href: "/contact" },
  ],
  legal: [
    { label: "Gizlilik Politikası", href: "/privacy" },
    { label: "Kullanım Şartları", href: "/terms" },
    { label: "KVKK", href: "/kvkk" },
    { label: "Çerezler", href: "/cookies" },
  ],
}

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-slate-400 max-w-sm">
              Spor okulları ve akademileri için tasarlanmış modern yönetim platformu. Öğrenci takibi, aidat yönetimi ve
              daha fazlası tek bir platformda.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Ürün</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Şirket</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="h-4 w-4" />
                <span>info@sporyonetim.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="h-4 w-4" />
                <span>0850 123 4567</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>İstanbul, Türkiye</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">© 2025 Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-slate-400 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

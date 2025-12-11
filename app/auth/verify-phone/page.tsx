"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Phone, ArrowRight, Loader2, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyPhonePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [code, setCode] = useState("")
  const phone = "0532 *** ** 67"

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsVerified(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  const handleResend = async () => {
    setIsResending(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsResending(false)
  }

  if (isVerified) {
    return (
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardContent className="pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Telefon Doğrulandı</h2>
          <p className="text-slate-400 mb-6">Telefon numaranız başarıyla doğrulandı.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Phone className="h-8 w-8 text-emerald-500" />
        </div>
        <CardTitle className="text-2xl text-white">Telefon Doğrulama</CardTitle>
        <CardDescription className="text-slate-400">
          <span className="text-white">{phone}</span> numarasına SMS ile gönderilen 6 haneli kodu girin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl tracking-[0.5em] bg-slate-800 border-slate-700 text-white h-14"
              required
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              <>
                Doğrula
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400 mb-2">Kod almadınız mı?</p>
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={isResending}
            className="text-emerald-500 hover:text-emerald-400"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tekrar Gönder
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

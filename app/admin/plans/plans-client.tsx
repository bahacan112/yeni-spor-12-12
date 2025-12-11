"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Check, X, Users, Layers, Building2, UserCog, Infinity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlatformPlan } from "@/lib/types"

const featureLabels: Record<string, string> = {
  basic_features: "Temel Özellikler",
  email_support: "E-posta Desteği",
  sms_notifications: "SMS Bildirimleri",
  website: "Web Sitesi",
  ecommerce: "E-ticaret",
  priority_support: "Öncelikli Destek",
  custom_domain: "Özel Domain",
  api_access: "API Erişimi",
}

interface PlansClientProps {
  plans: PlatformPlan[]
}

export function PlansClient({ plans }: PlansClientProps) {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paketler</h1>
          <p className="text-slate-400">Platform abonelik paketlerini yönetin</p>
        </div>
        <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Paket Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Paket Oluştur</DialogTitle>
              <DialogDescription className="text-slate-400">Yeni bir abonelik paketi tanımlayın</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Paket Adı</Label>
                <Input placeholder="Örn: Profesyonel" className="border-slate-700 bg-slate-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Açıklama</Label>
                <Textarea placeholder="Paket açıklaması..." className="border-slate-700 bg-slate-800 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Aylık Fiyat (TL)</Label>
                  <Input type="number" placeholder="999" className="border-slate-700 bg-slate-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Yıllık Fiyat (TL)</Label>
                  <Input type="number" placeholder="9990" className="border-slate-700 bg-slate-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Öğrenci</Label>
                  <Input
                    type="number"
                    placeholder="100 (boş = sınırsız)"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Grup</Label>
                  <Input type="number" placeholder="10" className="border-slate-700 bg-slate-800 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Şube</Label>
                  <Input type="number" placeholder="1" className="border-slate-700 bg-slate-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Eğitmen</Label>
                  <Input type="number" placeholder="5" className="border-slate-700 bg-slate-800 text-white" />
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Paket Oluştur</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, index) => (
          <Card
            key={plan.id}
            className={`relative border-slate-800 bg-slate-900 ${index === 2 ? "ring-2 ring-blue-500" : ""}`}
          >
            {index === 2 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">En Popüler</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch checked={plan.isActive} />
                </div>
              </div>
              <p className="text-sm text-slate-400">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.monthlyPrice.toLocaleString("tr-TR")}</span>
                  <span className="text-slate-400">TL/ay</span>
                </div>
                <p className="text-sm text-slate-500">veya {plan.yearlyPrice.toLocaleString("tr-TR")} TL/yıl</p>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Users className="h-4 w-4" />
                    Öğrenci
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxStudents === null ? <Infinity className="h-4 w-4" /> : plan.maxStudents}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Layers className="h-4 w-4" />
                    Grup
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxGroups === null ? <Infinity className="h-4 w-4" /> : plan.maxGroups}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Building2 className="h-4 w-4" />
                    Şube
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxBranches === null ? <Infinity className="h-4 w-4" /> : plan.maxBranches}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <UserCog className="h-4 w-4" />
                    Eğitmen
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxInstructors === null ? <Infinity className="h-4 w-4" /> : plan.maxInstructors}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-slate-500">Özellikler</p>
                <div className="space-y-2">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const hasFeature = plan.features.includes(key)
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {hasFeature ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-slate-600" />
                        )}
                        <span className={hasFeature ? "text-slate-300" : "text-slate-600"}>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-slate-700 text-slate-300 bg-transparent">
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

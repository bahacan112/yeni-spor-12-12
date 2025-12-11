"use client"

import { useState } from "react"
import { Lock, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InstructorSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <p className="text-slate-400">Hesap ayarlarınızı yönetin</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600">
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-600">
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-600">
            Bildirimler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Profil Bilgileri</CardTitle>
              <CardDescription className="text-slate-400">Kişisel bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/male-coach-portrait.jpg" />
                  <AvatarFallback className="bg-emerald-600 text-white text-xl">AK</AvatarFallback>
                </Avatar>
                <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
                  Fotoğraf Değiştir
                </Button>
              </div>

              {/* Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ad Soyad</Label>
                  <Input defaultValue="Ahmet Koç" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">E-posta</Label>
                  <Input defaultValue="ahmet.koc@akademi.com" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Telefon</Label>
                  <Input defaultValue="0532 123 4567" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Uzmanlık Alanı</Label>
                  <Input defaultValue="Futbol" className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Biyografi</Label>
                <textarea
                  defaultValue="10 yıllık deneyimli futbol eğitmeni. UEFA B lisansı sahibi."
                  className="w-full h-24 rounded-md bg-slate-800 border border-slate-700 text-white p-3 text-sm"
                />
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Şifre Değiştir</CardTitle>
              <CardDescription className="text-slate-400">Hesap güvenliğinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Mevcut Şifre</Label>
                <Input type="password" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Yeni Şifre</Label>
                <Input type="password" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Yeni Şifre (Tekrar)</Label>
                <Input type="password" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Lock className="mr-2 h-4 w-4" />
                Şifreyi Güncelle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Bildirim Tercihleri</CardTitle>
              <CardDescription className="text-slate-400">Bildirim ayarlarınızı düzenleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">E-posta Bildirimleri</p>
                  <p className="text-sm text-slate-400">Antrenman hatırlatmaları ve duyurular</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">SMS Bildirimleri</p>
                  <p className="text-sm text-slate-400">Acil duyurular ve değişiklikler</p>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Push Bildirimleri</p>
                  <p className="text-sm text-slate-400">Uygulama bildirimleri</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

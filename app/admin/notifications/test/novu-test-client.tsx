"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Inbox,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const WORKFLOWS = [
  { id: "dues-reminder", label: "💰 Aidat Hatırlatması", desc: "Ödeme yaklaşan öğrencilere gönderilir" },
  { id: "dues-overdue", label: "⚠️ Gecikmiş Aidat", desc: "Ödeme tarihi geçmiş öğrencilere" },
  { id: "payment-received", label: "✅ Ödeme Onayı", desc: "Ödeme alındığında gönderilir" },
  { id: "application-received", label: "📝 Başvuru Alındı", desc: "Yeni başvuru geldiğinde" },
  { id: "welcome-student", label: "🎓 Hoş Geldin", desc: "Yeni öğrenci kaydında" },
  { id: "training-cancelled", label: "❌ Antrenman İptali", desc: "Antrenman iptal edildiğinde" },
  { id: "training-reminder", label: "📅 Antrenman Hatırlatma", desc: "Antrenman öncesi hatırlatma" },
  { id: "attendance-absence", label: "🚷 Devamsızlık Bildirimi", desc: "Öğrenci antremana katılmadığında" },
  { id: "reservation-confirmed", label: "🏟️ Rezervasyon Onayı", desc: "Saha rezervasyonu onaylandığında" },
  { id: "reservation-cancelled", label: "🚫 Rezervasyon İptali", desc: "Saha rezervasyonu iptal edildiğinde" },
  { id: "announcement", label: "📢 Duyuru", desc: "Genel duyuru bildirimi" },
  { id: "custom-message", label: "✉️ Özel Mesaj", desc: "Özel içerikli bildirim" },
];

const CHANNELS = [
  { id: "email", label: "E-posta", icon: Mail, color: "text-blue-400", bg: "bg-blue-500/20" },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { id: "in_app", label: "In-App", icon: Inbox, color: "text-amber-400", bg: "bg-amber-500/20" },
  { id: "push", label: "Push", icon: Smartphone, color: "text-purple-400", bg: "bg-purple-500/20" },
];

interface TestResult {
  channel: string;
  workflow: string;
  success: boolean;
  message: string;
  timestamp: string;
}

export default function NovuTestClient() {
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [selectedWorkflow, setSelectedWorkflow] = useState("custom-message");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const sendTest = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedChannel,
          workflow: selectedWorkflow,
          email: email || undefined,
          phone: phone || undefined,
          message: message || undefined,
        }),
      });
      const json = await res.json();
      const result: TestResult = {
        channel: selectedChannel,
        workflow: selectedWorkflow,
        success: json.success,
        message: json.message || json.error || "Bilinmeyen sonuç",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
      };
      setResults((prev) => [result, ...prev]);
      if (json.success) {
        toast.success(json.message);
      } else {
        toast.error(json.message || json.error);
      }
    } catch (err: any) {
      const result: TestResult = {
        channel: selectedChannel,
        workflow: selectedWorkflow,
        success: false,
        message: err.message || "Bağlantı hatası",
        timestamp: new Date().toLocaleTimeString("tr-TR"),
      };
      setResults((prev) => [result, ...prev]);
      toast.error("Bildirim gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const sendAllChannels = async () => {
    setSending(true);
    for (const ch of CHANNELS) {
      try {
        const res = await fetch("/api/notifications/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: ch.id,
            workflow: selectedWorkflow,
            email: email || undefined,
            phone: phone || undefined,
            message: message || undefined,
          }),
        });
        const json = await res.json();
        setResults((prev) => [
          {
            channel: ch.id,
            workflow: selectedWorkflow,
            success: json.success,
            message: json.message || json.error || "",
            timestamp: new Date().toLocaleTimeString("tr-TR"),
          },
          ...prev,
        ]);
      } catch {
        setResults((prev) => [
          {
            channel: ch.id,
            workflow: selectedWorkflow,
            success: false,
            message: "Bağlantı hatası",
            timestamp: new Date().toLocaleTimeString("tr-TR"),
          },
          ...prev,
        ]);
      }
    }
    setSending(false);
    toast.info("Tüm kanallar test edildi");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          Novu Bildirim Test Paneli
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          E-posta, SMS, In-App ve Push bildirimlerini test edin
        </p>
      </div>

      {/* Novu Durum */}
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <Bell className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Novu Bildirim Servisi</p>
                <p className="text-xs text-slate-400">
                  novu-api.mysportschool.com — Self-Hosted
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400">Bağlı</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sol: Test Formu */}
        <div className="space-y-4">
          {/* Kanal Seçimi */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-300">
                1. Kanal Seçin
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <Button
                      key={ch.id}
                      variant={selectedChannel === ch.id ? "default" : "outline"}
                      onClick={() => setSelectedChannel(ch.id)}
                      className={
                        selectedChannel === ch.id
                          ? `${ch.bg} ${ch.color} border-0`
                          : "border-slate-700 text-slate-300 bg-transparent"
                      }
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {ch.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Seçimi */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-300">
                2. Workflow Seçin
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  {WORKFLOWS.map((wf) => (
                    <SelectItem key={wf.id} value={wf.id} className="text-white">
                      {wf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {WORKFLOWS.find((w) => w.id === selectedWorkflow)?.desc}
              </p>
            </CardContent>
          </Card>

          {/* Alıcı Bilgileri */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-300">
                3. Test Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {selectedChannel === "email" && (
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">E-posta Adresi</Label>
                  <Input
                    placeholder="test@ornek.com (boş bırakırsanız giriş e-postanız kullanılır)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              )}
              {selectedChannel === "sms" && (
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Telefon Numarası</Label>
                  <Input
                    placeholder="+905321234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              )}
              {(selectedChannel === "in_app" || selectedChannel === "push") && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-xs text-amber-300">
                    💡 {selectedChannel === "in_app" ? "In-App" : "Push"} bildirimi giriş yapmış kullanıcınıza (subscriber) gönderilecektir. E-posta gerekli değildir.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Özel Mesaj (Opsiyonel)</Label>
                <Textarea
                  placeholder="Test mesajınızı yazın..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <p className="text-xs text-slate-400">
                  ℹ️ Novu code-first workflow&apos;ları tüm kanalları (Email, Push, In-App) tek seferde çalıştırır. Kanal seçimi, alıcı bilgilerinin hangi kanalda kullanılacağını belirler.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gönder Butonları */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={sending}
              onClick={sendTest}
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Test Gönder ({CHANNELS.find((c) => c.id === selectedChannel)?.label})
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 bg-transparent"
              disabled={sending}
              onClick={sendAllChannels}
            >
              <Zap className="mr-2 h-4 w-4" />
              Tüm Kanallar
            </Button>
          </div>
        </div>

        {/* Sağ: Sonuçlar */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-300">
                  Test Sonuçları
                </CardTitle>
                {results.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResults([])}
                    className="text-slate-500 text-xs"
                  >
                    Temizle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {results.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Henüz test gönderimi yapılmadı</p>
                  <p className="text-xs mt-1">Sol panelden bir test gönderin</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {results.map((r, i) => {
                    const ch = CHANNELS.find((c) => c.id === r.channel);
                    const Icon = ch?.icon || Bell;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          r.success
                            ? "border-emerald-800/50 bg-emerald-950/30"
                            : "border-red-800/50 bg-red-950/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${r.success ? "text-emerald-400" : "text-red-400"}`}>
                            {r.success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-3.5 w-3.5 ${ch?.color || ""}`} />
                              <span className="text-xs font-medium text-white uppercase">
                                {ch?.label}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 border-slate-700 text-slate-400"
                              >
                                {r.workflow}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 truncate">
                              {r.message}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {r.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Novu Dashboard Link */}
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-white mb-2">
                📋 Novu Dashboard&apos;da Yapılacaklar
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">1.</span>
                  <span>
                    <strong className="text-slate-300">Workflow oluşturun:</strong> Workflows → Create
                    → Yukarıdaki ID&apos;lerle (örn: dues-reminder)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">2.</span>
                  <span>
                    <strong className="text-slate-300">E-posta şablonu:</strong> Workflow içine Email
                    step ekleyin ve şablonu düzenleyin
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">3.</span>
                  <span>
                    <strong className="text-slate-300">SMTP ayarı:</strong> Integrations → Email →
                    SMTP bilgilerini girin
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">4.</span>
                  <span>
                    <strong className="text-slate-300">SMS provider:</strong> Integrations → SMS →
                    Twilio/Netgsm ekleyin (opsiyonel)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">5.</span>
                  <span>
                    <strong className="text-slate-300">Activity Feed:</strong> Dashboard&apos;da
                    gönderim durumunu izleyin
                  </span>
                </li>
              </ul>
              <a
                href="https://novu.mysportschool.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
              >
                Novu Dashboard&apos;u Aç →
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

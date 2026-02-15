"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCcw,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tenant,
  TenantSubscription,
  TenantPayment,
  NotificationLog,
  ScheduledNotification,
  NotificationTemplate,
} from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildUserIdFromParts } from "@/lib/dittofeed/utils";
import { TENANT_SUB_EVENTS } from "@/lib/dittofeed/events/tenant-subscription";

type Props = {
  tenants: Tenant[];
  subscriptions: TenantSubscription[];
  payments: TenantPayment[];
  notifications: {
    logs: NotificationLog[];
    templates: NotificationTemplate[];
    scheduled: ScheduledNotification[];
  };
};

export default function DittofeedClient({
  tenants,
  subscriptions,
  payments,
  notifications,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("identify");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Dittofeed SMTP Test");
  const [content, setContent] = useState(
    "Merhaba,\nBu bir Dittofeed SMTP test e-postasıdır."
  );
  const [sending, setSending] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number | "">("");
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [from, setFrom] = useState("");
  const [fromName, setFromName] = useState("");
  const [setDefault, setSetDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [journeyExists, setJourneyExists] = useState<boolean | null>(null);
  const [eventName, setEventName] = useState("TestEmail");
  const [sending13, setSending13] = useState(false);
  const [identifyTenantId, setIdentifyTenantId] = useState<string>("platform");
  const [identifyRole, setIdentifyRole] = useState<
    "tenant_admin" | "super_admin"
  >("tenant_admin");
  const [identifyUserId, setIdentifyUserId] = useState<string>("");
  const [identifyEmail, setIdentifyEmail] = useState<string>("");
  const [identifyFullName, setIdentifyFullName] = useState<string>("");
  const [trackTenantId, setTrackTenantId] = useState<string>("platform");
  const [trackUserId, setTrackUserId] = useState<string>("");
  const [trackEventKey, setTrackEventKey] = useState<string>(
    "TenantSubscriptionCreated"
  );
  const [trackPropertiesText, setTrackPropertiesText] = useState<string>("{}");
  const [subTenantId, setSubTenantId] = useState<string>("");
  const [subUserId, setSubUserId] = useState<string>("");
  const [subEventKey, setSubEventKey] = useState<string>(
    TENANT_SUB_EVENTS.SubscriptionCreated
  );
  const [triggering, setTriggering] = useState<boolean>(false);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const res = await fetch("/api/integrations/dittofeed/email-provider");
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.providers) ? data.providers : [];
        setProviders(items);
        const current = items.find((p: any) => p?.isDefault) || items[0];
        if (current && current.type === "SMTP") {
          setHost(String(current?.config?.host || ""));
          setPort(Number(current?.config?.port) || "");
          setSecure(Boolean(current?.config?.secure));
          setUsername(String(current?.config?.username || ""));
          setFrom(String(current?.config?.from || ""));
          setFromName(String(current?.config?.fromName || ""));
        }
      } finally {
        setLoaded(true);
      }
    };
    loadProviders();
    const checkJourney = async () => {
      try {
        const res = await fetch("/api/integrations/dittofeed/journey");
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        setJourneyExists(Boolean(data?.exists));
      } catch {}
    };
    checkJourney();
  }, []);

  const selectedSub = useMemo(() => {
    if (!subTenantId) return undefined;
    return subscriptions.find((s) => s.tenantId === subTenantId);
  }, [subTenantId, subscriptions]);

  const latestPayment = useMemo(() => {
    if (!subTenantId) return undefined;
    const ps = payments.filter((p) => p.tenantId === subTenantId);
    return ps.sort((a, b) =>
      String(b.paidAt || "").localeCompare(String(a.paidAt || ""))
    )[0];
  }, [subTenantId, payments]);

  const runTest = async () => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Geçerli bir e-posta adresi girin");
      return;
    }
    setSending(true);
    try {
      const baseId = `user:${email}`;
      const userId = baseId.replace(/[^A-Za-z0-9_-]/g, "_");
      const identifyRes = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "identify",
          userId,
          traits: { email },
        }),
      });
      if (!identifyRes.ok) {
        const data = await identifyRes.json().catch(() => ({}));
        throw new Error(String(data?.error || "Identify başarısız"));
      }
      const trackRes = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "track",
          userId,
          event: eventName,
          properties: { subject, content, email, to: email },
        }),
      });
      if (!trackRes.ok) {
        const data = await trackRes.json().catch(() => ({}));
        throw new Error(String(data?.error || "Track başarısız"));
      }
      toast.success(
        "Test e-postası tetiklendi. Teslimat için Dittofeed loglarını kontrol edin."
      );
    } catch (e: any) {
      toast.error(e.message || "Test e-postası gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const runIdentify = async () => {
    const tenantId =
      identifyRole === "super_admin" ? "platform" : identifyTenantId || "";
    const uid = buildUserIdFromParts("users", tenantId, identifyUserId || "");
    try {
      const res = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "identify",
          userId: uid,
          traits: {
            email: identifyEmail || undefined,
            fullName: identifyFullName || undefined,
            role: identifyRole,
            tenantId,
            tenantName:
              tenants.find((t) => t.id === identifyTenantId)?.name ||
              (tenantId === "platform" ? "Platform" : undefined),
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String(data?.error || "Identify başarısız"));
      }
      toast.success("Kimlik gönderildi");
    } catch (e: any) {
      toast.error(e.message || "Kimlik gönderilemedi");
    }
  };

  const beautifyTrackJson = () => {
    try {
      const obj = trackPropertiesText ? JSON.parse(trackPropertiesText) : {};
      setTrackPropertiesText(JSON.stringify(obj, null, 2));
      toast.success("JSON düzenlendi");
    } catch {
      toast.error("Geçersiz JSON");
    }
  };

  const minifyTrackJson = () => {
    try {
      const obj = trackPropertiesText ? JSON.parse(trackPropertiesText) : {};
      setTrackPropertiesText(JSON.stringify(obj));
      toast.success("JSON sıkıştırıldı");
    } catch {
      toast.error("Geçersiz JSON");
    }
  };

  const validateTrackJson = () => {
    try {
      JSON.parse(trackPropertiesText || "{}");
      toast.success("JSON geçerli");
    } catch {
      toast.error("Geçersiz JSON");
    }
  };

  const autofillBasicEmailProps = () => {
    const base = {
      email: identifyEmail || email || "",
      to: identifyEmail || email || "",
      subject,
      content,
    };
    setTrackPropertiesText(JSON.stringify(base, null, 2));
  };

  const autofillSubscriptionProps = () => {
    const tId = trackTenantId === "platform" ? "" : trackTenantId;
    const t = tenants.find((x) => x.id === tId);
    const s = subscriptions.find((x) => x.tenantId === tId);
    const ps = payments.filter((p) => p.tenantId === tId);
    const p = ps.sort((a, b) =>
      String(b.paidAt || "").localeCompare(String(a.paidAt || ""))
    )[0];
    const base: Record<string, any> = {
      tenantId: tId || "platform",
      tenantName: t?.name || (tId ? undefined : "Platform"),
    };
    if (s) {
      Object.assign(base, {
        planId: s.planId,
        planName: s.plan?.name,
        billingPeriod: s.billingPeriod,
        amount: s.amount,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        autoRenew: s.autoRenew,
        paymentMethod: s.paymentMethod,
        isTrial: s.isTrial,
        trialDays: s.trialDays,
      });
    }
    if (p) {
      Object.assign(base, {
        invoiceNo: p.invoiceNo,
        description: p.description,
      });
    }
    setTrackPropertiesText(JSON.stringify(base, null, 2));
  };

  const autofillPaymentProps = () => {
    const tId = trackTenantId === "platform" ? "" : trackTenantId;
    const ps = payments.filter((p) => p.tenantId === tId);
    const p = ps.sort((a, b) =>
      String(b.paidAt || "").localeCompare(String(a.paidAt || ""))
    )[0];
    const base: Record<string, any> = p
      ? {
          tenantId: tId || "platform",
          invoiceNo: p.invoiceNo,
          description: p.description,
          amount: p.amount,
          status: p.status,
          paidAt: p.paidAt,
        }
      : { tenantId: tId || "platform" };
    setTrackPropertiesText(JSON.stringify(base, null, 2));
  };

  const runGenericTrack = async () => {
    const uid = buildUserIdFromParts(
      "users",
      trackTenantId || "platform",
      trackUserId || ""
    );
    let properties: Record<string, any> | undefined = undefined;
    try {
      const parsed = trackPropertiesText ? JSON.parse(trackPropertiesText) : {};
      properties = parsed && typeof parsed === "object" ? parsed : undefined;
    } catch {
      toast.error("Properties JSON geçersiz");
      return;
    }
    try {
      const res = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "track",
          userId: uid,
          event: trackEventKey,
          properties,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String(data?.error || "Track başarısız"));
      }
      toast.success("Event tetiklendi");
    } catch (e: any) {
      toast.error(e.message || "Event gönderilemedi");
    }
  };

  const runSubscriptionScenario = async () => {
    if (!subTenantId) {
      toast.error("Tenant seçin");
      return;
    }
    const uid = buildUserIdFromParts(
      "users",
      subTenantId || "platform",
      subUserId || ""
    );
    const t = tenants.find((x) => x.id === subTenantId);
    const s = selectedSub;
    const p = latestPayment;
    const base: Record<string, any> = {
      tenantId: subTenantId,
      tenantName: t?.name,
    };
    if (s) {
      Object.assign(base, {
        planId: s.planId,
        planName: s.plan?.name,
        billingPeriod: s.billingPeriod,
        amount: s.amount,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        autoRenew: s.autoRenew,
        paymentMethod: s.paymentMethod,
        isTrial: s.isTrial,
        trialDays: s.trialDays,
      });
    }
    if (p) {
      Object.assign(base, {
        invoiceNo: p.invoiceNo,
        description: p.description,
      });
    }
    setTriggering(true);
    try {
      const res = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "track",
          userId: uid,
          event: subEventKey,
          properties: base,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String(data?.error || "Track başarısız"));
      }
      toast.success("Abonelik senaryosu tetiklendi");
    } catch (e: any) {
      toast.error(e.message || "Gönderim başarısız");
    } finally {
      setTriggering(false);
    }
  };

  const runResend13 = async () => {
    setSending13(true);
    try {
      const fixedEmail = "bzenbil19@gmail.com";
      const baseId = `user:${fixedEmail}`;
      const userId = baseId.replace(/[^A-Za-z0-9_-]/g, "_");
      const identifyRes = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "identify",
          userId,
          traits: {
            email: fixedEmail,
            firstName: "Matt",
            lastName: "Smith",
          },
        }),
      });
      if (!identifyRes.ok) {
        const data = await identifyRes.json().catch(() => ({}));
        throw new Error(String(data?.error || "Identify başarısız"));
      }
      const res = await fetch("/api/integrations/dittofeed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "track",
          userId,
          event: "13",
          properties: {
            userid: baseId,
            email: fixedEmail,
            to: fixedEmail,
            subject,
            content,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String(data?.error || "Track başarısız"));
      }
      toast.success("13 event ile test mail tetiklendi");
    } catch (e: any) {
      toast.error(e.message || "Gönderim başarısız");
    } finally {
      setSending13(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Dittofeed Test Merkezi
        </h1>
        <p className="text-slate-400">
          Kimlik, event ve abonelik senaryolarını tek yerden deneyin
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="identify">Kimlik Testi</TabsTrigger>
          <TabsTrigger value="generic">Serbest Event</TabsTrigger>
          <TabsTrigger value="subscription">Abonelik Senaryoları</TabsTrigger>
          <TabsTrigger value="logs">Log Görünümleri</TabsTrigger>
        </TabsList>
        <TabsContent value="identify">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="space-y-4 p-4">
              <div className="text-white">Kimlik Testi</div>
              <div className="text-xs text-slate-400">
                Belirtilen kullanıcı için kimlik bilgilerini gönderir
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Rol</Label>
                  <Select
                    value={identifyRole}
                    onValueChange={(v) =>
                      setIdentifyRole(v as "tenant_admin" | "super_admin")
                    }
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_admin">tenant_admin</SelectItem>
                      <SelectItem value="super_admin">super_admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tenant</Label>
                  <Select
                    value={identifyTenantId}
                    onValueChange={(v) => setIdentifyTenantId(v)}
                    disabled={identifyRole === "super_admin"}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Tenant seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">platform</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">User ID</Label>
                  <Input
                    value={identifyUserId}
                    onChange={(e) => setIdentifyUserId(e.target.value)}
                    placeholder="USER_UUID"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    value={identifyEmail}
                    onChange={(e) => setIdentifyEmail(e.target.value)}
                    placeholder="admin@okul.com"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Ad Soyad</Label>
                  <Input
                    value={identifyFullName}
                    onChange={(e) => setIdentifyFullName(e.target.value)}
                    placeholder="Okul Admin"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runIdentify}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Identify Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="generic">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="space-y-4 p-4">
              <div className="text-white">Serbest Event</div>
              <div className="text-xs text-slate-400">
                Dilediğiniz event’i properties ile birlikte gönderin
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Tenant</Label>
                  <Select
                    value={trackTenantId}
                    onValueChange={(v) => setTrackTenantId(v)}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Tenant seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">platform</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">User ID</Label>
                  <Input
                    value={trackUserId}
                    onChange={(e) => setTrackUserId(e.target.value)}
                    placeholder="USER_UUID"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Event Key</Label>
                  <Input
                    value={trackEventKey}
                    onChange={(e) => setTrackEventKey(e.target.value)}
                    placeholder="TenantSubscriptionCreated"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="md:col-span-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={autofillBasicEmailProps}
                    >
                      Auto-fill: E-posta
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={autofillSubscriptionProps}
                    >
                      Auto-fill: Abonelik Özeti
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={autofillPaymentProps}
                    >
                      Auto-fill: Ödeme Özeti
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={validateTrackJson}
                    >
                      JSON Kontrol
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={beautifyTrackJson}
                    >
                      Beautify
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={minifyTrackJson}
                    >
                      Minify
                    </Button>
                  </div>
                  <Label className="text-slate-300">Properties (JSON)</Label>
                  <textarea
                    value={trackPropertiesText}
                    onChange={(e) => setTrackPropertiesText(e.target.value)}
                    rows={8}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runGenericTrack}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Event Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscription">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="space-y-4 p-4">
              <div className="text-white">Abonelik Senaryoları</div>
              <div className="text-xs text-slate-400">
                Okul abonelik akışlarını simulate ederek bildirimleri test edin
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Tenant</Label>
                  <Select
                    value={subTenantId}
                    onValueChange={(v) => setSubTenantId(v)}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Tenant seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">User ID</Label>
                  <Input
                    value={subUserId}
                    onChange={(e) => setSubUserId(e.target.value)}
                    placeholder="ADMIN_UUID"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Senaryo</Label>
                  <Select
                    value={subEventKey}
                    onValueChange={(v) => setSubEventKey(v)}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Senaryo seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TENANT_SUB_EVENTS.SubscriptionCreated}>
                        SubscriptionCreated
                      </SelectItem>
                      <SelectItem
                        value={TENANT_SUB_EVENTS.SubscriptionRenewalUpcoming}
                      >
                        RenewalUpcoming
                      </SelectItem>
                      <SelectItem value={TENANT_SUB_EVENTS.SubscriptionExpired}>
                        Expired
                      </SelectItem>
                      <SelectItem
                        value={TENANT_SUB_EVENTS.SubscriptionCancelled}
                      >
                        Cancelled
                      </SelectItem>
                      <SelectItem value={TENANT_SUB_EVENTS.PaymentCompleted}>
                        PaymentCompleted
                      </SelectItem>
                      <SelectItem value={TENANT_SUB_EVENTS.PaymentFailed}>
                        PaymentFailed
                      </SelectItem>
                      <SelectItem value={TENANT_SUB_EVENTS.PlanChanged}>
                        PlanChanged
                      </SelectItem>
                      <SelectItem value={TENANT_SUB_EVENTS.AutoRenewToggled}>
                        AutoRenewToggled
                      </SelectItem>
                      <SelectItem value={TENANT_SUB_EVENTS.TrialWillEnd}>
                        TrialWillEnd
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 text-slate-300 text-sm">
                  {selectedSub ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <div>Plan: {String(selectedSub.plan?.name || "")}</div>
                      <div>
                        Dönem: {String(selectedSub.billingPeriod || "")}
                      </div>
                      <div>Tutar: {String(selectedSub.amount ?? "")}</div>
                      <div>Durum: {String(selectedSub.status || "")}</div>
                      <div>
                        Başlangıç:{" "}
                        {String(selectedSub.currentPeriodStart || "")}
                      </div>
                      <div>
                        Bitiş: {String(selectedSub.currentPeriodEnd || "")}
                      </div>
                    </div>
                  ) : (
                    <div>Bu tenant için abonelik bilgisi bulunamadı</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runSubscriptionScenario}
                  disabled={triggering}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {triggering ? "Gönderiliyor..." : "Senaryoyu Tetikle"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="space-y-4 p-4">
              <div className="text-white">Log Görünümleri</div>
              <div className="text-xs text-slate-400">
                Son bildirim logları ve zamanlanmış bildirimler
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="text-slate-200 mb-2">Son Loglar</div>
                  <div className="space-y-2">
                    {(notifications.logs || []).slice(0, 20).map((log) => {
                      const tpl = notifications.templates.find(
                        (t) =>
                          t.id === (log as any).templateId ||
                          t.id === (log as any).template_id
                      );
                      const tenName =
                        (log as any).tenant?.name ||
                        tenants.find(
                          (t) =>
                            t.id === (log as any).tenantId ||
                            t.id === (log as any).tenant_id
                        )?.name ||
                        "";
                      return (
                        <div
                          key={log.id}
                          className="rounded-md border border-slate-700 p-3 text-sm text-slate-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {tpl?.name || log.subject || "Şablon"}
                            </div>
                            <div
                              className={
                                log.status === "failed"
                                  ? "text-amber-400"
                                  : log.status === "delivered"
                                  ? "text-emerald-400"
                                  : "text-slate-400"
                              }
                            >
                              {log.status}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            {log.channel} • {tenName} • {log.recipientContact}
                          </div>
                          <div className="text-xs text-slate-500">
                            {String(log.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-slate-200 mb-2">
                    Zamanlanmış Bildirimler
                  </div>
                  <div className="space-y-2">
                    {(notifications.scheduled || []).map((sn) => (
                      <div
                        key={sn.id}
                        className="rounded-md border border-slate-700 p-3 text-sm text-slate-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {sn.template?.name || "Şablon"}
                          </div>
                          <div className="text-slate-400">{sn.triggerType}</div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {sn.triggerDays} gün • {sn.targetAudience}
                        </div>
                        <div className="text-xs text-slate-500">
                          Son Çalışma: {String(sn.lastRunAt || "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">Mevcut SMTP Kurulumu</div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={async () => {
                setLoaded(false);
                try {
                  const res = await fetch(
                    "/api/integrations/dittofeed/email-provider"
                  );
                  const data = await res.json().catch(() => ({}));
                  const items = Array.isArray(data?.providers)
                    ? data.providers
                    : [];
                  setProviders(items);
                  const current =
                    items.find((p: any) => p?.isDefault) || items[0];
                  if (current && current.type === "SMTP") {
                    setHost(String(current?.config?.host || ""));
                    setPort(Number(current?.config?.port) || "");
                    setSecure(Boolean(current?.config?.secure));
                    setUsername(String(current?.config?.username || ""));
                    setFrom(String(current?.config?.from || ""));
                    setFromName(String(current?.config?.fromName || ""));
                  }
                } finally {
                  setLoaded(true);
                }
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
          {providers.length === 0 ? (
            <div className="text-slate-400 text-sm">
              Kurulu sağlayıcı bulunamadı. SMTP’yi kaydedebilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-slate-700 p-3"
                >
                  <div className="text-slate-200 text-sm">
                    Sağlayıcı: {String(p?.type || "Bilinmiyor")}
                    {p?.isDefault ? " • Varsayılan" : ""}
                  </div>
                  {p?.type === "SMTP" && (
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 text-slate-300 text-sm">
                      <div>Host: {String(p?.config?.host || "")}</div>
                      <div>Port: {String(p?.config?.port ?? "")}</div>
                      <div>SSL/TLS: {p?.config?.secure ? "Evet" : "Hayır"}</div>
                      <div>Kullanıcı: {String(p?.config?.username || "")}</div>
                      <div>Gönderen: {String(p?.config?.from || "")}</div>
                      <div>
                        Gönderen Adı: {String(p?.config?.fromName || "")}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white">{eventName} Journey</div>
              <div className="text-xs text-slate-400">
                {`Track("${eventName}") geldiğinde e-posta gönderir`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`text-xs ${
                  journeyExists ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {journeyExists === null
                  ? "Kontrol ediliyor..."
                  : journeyExists
                  ? "Mevcut"
                  : "Yok"}
              </div>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      "/api/integrations/dittofeed/journey",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ eventName }),
                      }
                    );
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || data?.error) {
                      throw new Error(
                        String(data?.error || "Journey oluşturulamadı")
                      );
                    }
                    setJourneyExists(true);
                    toast.success(
                      data?.created
                        ? "Journey oluşturuldu"
                        : "Journey zaten mevcut"
                    );
                  } catch (e: any) {
                    toast.error(e.message || "İşlem başarısız");
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Journey Oluştur
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">SMTP Host</Label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.mailserver.com"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Port</Label>
              <Input
                type="number"
                value={port}
                onChange={(e) =>
                  setPort(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="587"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Kullanıcı Adı</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Parola</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Gönderen E-posta</Label>
              <Input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="no-reply@domain.com"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Gönderen Adı</Label>
              <Input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Spor Okulu"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="secure"
                type="checkbox"
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
              />
              <Label htmlFor="secure" className="text-slate-300">
                TLS/SSL
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="setDefault"
                type="checkbox"
                checked={setDefault}
                onChange={(e) => setSetDefault(e.target.checked)}
              />
              <Label htmlFor="setDefault" className="text-slate-300">
                Varsayılan Yap
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                if (!host || !port || !username || !password) {
                  toast.error("Host, port, kullanıcı adı ve parola gerekli");
                  return;
                }
                setSaving(true);
                try {
                  const res = await fetch(
                    "/api/integrations/dittofeed/email-provider",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        host,
                        port,
                        secure,
                        username,
                        password,
                        from: from || undefined,
                        fromName: fromName || undefined,
                        setDefault,
                      }),
                    }
                  );
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(
                      String(data?.error || "SMTP kaydedilemedi")
                    );
                  }
                  toast.success("SMTP yapılandırması kaydedildi");
                  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                    runTest();
                  }
                } catch (e: any) {
                  toast.error(e.message || "İşlem başarısız");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? "Kaydediliyor..." : "SMTP Ayarlarını Kaydet"}
            </Button>
            {!loaded && (
              <div className="text-xs text-slate-400">
                Yapılandırma yükleniyor...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Alıcı E-posta</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@domain.com"
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Event Adı</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="TestEmail"
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Konu</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">İçerik</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={runTest}
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {sending ? "Gönderiliyor..." : "Test Mail Gönder"}
            </Button>
            <Button
              onClick={runResend13}
              disabled={sending13}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sending13 ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sending13 ? "Gönderiliyor..." : "13 ile Gönder"}
            </Button>
            <div className="flex items-center text-xs text-amber-400">
              <AlertTriangle className="mr-1 h-3 w-3" />
              SMTP gönderimi için Dittofeed yapılandırması gerekli
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

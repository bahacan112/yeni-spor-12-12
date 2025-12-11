"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Clock,
  AlertTriangle,
  Plus,
  Settings,
  History,
  FileText,
  CheckCircle,
  XCircle,
  Smartphone,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MonthlyDue, Student, NotificationTemplate } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface NotificationsClientProps {
  dues: MonthlyDue[];
  students: Student[];
  templates: NotificationTemplate[];
  tenantId?: string;
}

// Mock notification history (keeping mock for history as we don't have a history table yet or it's empty)
const notificationHistory = [
  {
    id: "log-1",
    type: "sms",
    recipientCount: 15,
    template: "Ödeme Hatırlatması",
    sentAt: "2024-12-08T10:00:00Z",
    status: "sent",
    successCount: 14,
    failCount: 1,
  },
  {
    id: "log-2",
    type: "email",
    recipientCount: 23,
    template: "Gecikmiş Ödeme",
    sentAt: "2024-12-07T14:30:00Z",
    status: "sent",
    successCount: 23,
    failCount: 0,
  },
  {
    id: "log-3",
    type: "push",
    recipientCount: 8,
    template: "Antrenman İptali",
    sentAt: "2024-12-06T09:15:00Z",
    status: "sent",
    successCount: 8,
    failCount: 0,
  },
];

// Mock scheduled notifications (keeping mock for now)
const scheduledNotifications = [
  {
    id: "sch-1",
    name: "Haftalık Ödeme Hatırlatması",
    template: "Ödeme Hatırlatması",
    schedule: "Her Pazartesi 09:00",
    target: "7 gün içinde ödemesi olanlar",
    channels: ["sms", "email"],
    isActive: true,
  },
  {
    id: "sch-2",
    name: "Gecikmiş Ödeme Bildirimi",
    template: "Gecikmiş Ödeme",
    schedule: "Her gün 10:00",
    target: "Ödemesi gecikenler",
    channels: ["sms"],
    isActive: true,
  },
];

export function NotificationsClient({
  dues,
  students,
  templates,
  tenantId,
}: NotificationsClientProps) {
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [notificationChannels, setNotificationChannels] = useState({
    sms: true,
    email: false,
    push: false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // Ödemesi yaklaşan öğrenciler
  const upcomingPayments = dues.filter((due) => {
    const dueDate = new Date(due.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 7 && daysUntilDue > 0 && due.status === "pending";
  });

  // Gecikmiş ödemeler
  const overduePayments = dues.filter((due) => due.status === "overdue");

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllUpcoming = () => {
    // Only select if we have valid studentIds
    const ids = upcomingPayments
      .map((d) => d.studentId)
      .filter(Boolean) as string[];
    setSelectedStudents(ids);
  };

  const selectAllOverdue = () => {
    const ids = overduePayments
      .map((d) => d.studentId)
      .filter(Boolean) as string[];
    setSelectedStudents(ids);
  };

  const toggleChannel = (channel: "sms" | "email" | "push") => {
    setNotificationChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "sms":
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case "email":
        return <Mail className="h-4 w-4 text-blue-400" />;
      case "push":
        return <Smartphone className="h-4 w-4 text-purple-400" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bildirim Merkezi</h1>
          <p className="text-sm text-slate-400">
            SMS, E-posta ve Push bildirimlerini yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Sheet
            open={isTemplateSheetOpen}
            onOpenChange={setIsTemplateSheetOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 bg-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Şablonlar
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full border-slate-800 bg-slate-900 sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-white">
                  Bildirim Şablonları
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  Hazır mesaj şablonlarını yönetin
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="border-slate-700 bg-slate-800"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">
                              {template.name}
                            </h3>
                            <Badge
                              className={
                                template.isActive
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-slate-500/20 text-slate-400"
                              }
                            >
                              {template.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                          </div>
                          {/* Assuming content is stored in 'content' field in DB, mapping to smsContent for display if needed or just showing content */}
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Şablon Ekle
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={isScheduleSheetOpen}
            onOpenChange={setIsScheduleSheetOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 bg-transparent"
              >
                <Clock className="mr-2 h-4 w-4" />
                Zamanlanmış
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full border-slate-800 bg-slate-900 sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-white">
                  Otomatik Bildirimler
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  Zamanlanmış otomatik bildirimleri yönetin
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {scheduledNotifications.map((schedule) => (
                  <Card
                    key={schedule.id}
                    className="border-slate-700 bg-slate-800"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">
                              {schedule.name}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {schedule.schedule}
                          </p>
                          <p className="text-xs text-slate-500">
                            Hedef: {schedule.target}
                          </p>
                          <div className="mt-2 flex gap-1">
                            {schedule.channels.map((ch) => (
                              <span key={ch}>{getChannelIcon(ch)}</span>
                            ))}
                          </div>
                        </div>
                        <Switch checked={schedule.isActive} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Zamanlama Ekle
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" />
                Bildirim Gönder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Bildirim Gönder
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedStudents.length > 0
                    ? `${selectedStudents.length} kişiye bildirim gönder`
                    : "Alıcıları seçin"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Channel Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Gönderim Kanalları</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={notificationChannels.sms ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleChannel("sms")}
                      className={
                        notificationChannels.sms
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "border-slate-700 text-slate-300 bg-transparent"
                      }
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      SMS
                    </Button>
                    <Button
                      variant={
                        notificationChannels.email ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleChannel("email")}
                      className={
                        notificationChannels.email
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "border-slate-700 text-slate-300 bg-transparent"
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      E-posta
                    </Button>
                    <Button
                      variant={
                        notificationChannels.push ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleChannel("push")}
                      className={
                        notificationChannels.push
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "border-slate-700 text-slate-300 bg-transparent"
                      }
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      Push
                    </Button>
                  </div>
                </div>

                {/* Template Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-300">Şablon Seç</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Şablon seçin veya özel mesaj yazın" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      <SelectItem value="custom" className="text-white">
                        Özel Mesaj
                      </SelectItem>
                      {templates.map((tpl) => (
                        <SelectItem
                          key={tpl.id}
                          value={tpl.id}
                          className="text-white"
                        >
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Message */}
                {(selectedTemplate === "custom" || !selectedTemplate) && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Mesaj</Label>
                    <Textarea
                      placeholder="Bildirim mesajınızı yazın..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                    <p className="text-xs text-slate-500">
                      Değişkenler: {"{öğrenci_adı}"}, {"{veli_adı}"},{" "}
                      {"{tutar}"}, {"{son_ödeme}"}
                    </p>
                  </div>
                )}

                {/* Preview */}
                {selectedTemplate && selectedTemplate !== "custom" && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Önizleme</Label>
                    <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-300">
                      {
                        templates.find((t) => t.id === selectedTemplate)
                          ?.content
                      }
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="rounded-lg bg-slate-800 p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Alıcı Sayısı</span>
                    <span className="font-medium text-white">
                      {selectedStudents.length} kişi
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Gönderim Kanalı</span>
                    <div className="flex gap-2">
                      {notificationChannels.sms && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          SMS
                        </Badge>
                      )}
                      {notificationChannels.email && (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          E-posta
                        </Badge>
                      )}
                      {notificationChannels.push && (
                        <Badge className="bg-purple-500/20 text-purple-400">
                          Push
                        </Badge>
                      )}
                    </div>
                  </div>
                  {notificationChannels.sms && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Tahmini SMS Maliyeti
                      </span>
                      <span className="font-medium text-amber-400">
                        {(selectedStudents.length * 0.25).toFixed(2)} TL
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={
                    selectedStudents.length === 0 ||
                    (!notificationChannels.sms &&
                      !notificationChannels.email &&
                      !notificationChannels.push)
                  }
                  onClick={async () => {
                    const message =
                      selectedTemplate === "custom"
                        ? customMessage
                        : templates.find((t) => t.id === selectedTemplate)
                            ?.content || "";
                    const rows = selectedStudents.map((sid) => ({
                      tenant_id: tenantId,
                      recipient_type: "student",
                      recipient_id: sid,
                      recipient_contact: "-",
                      channel: notificationChannels.sms
                        ? "sms"
                        : notificationChannels.email
                        ? "email"
                        : "push",
                      content: message,
                      status: "pending",
                      created_at: new Date().toISOString(),
                    }));
                    const { error } = await supabase
                      .from("notification_logs")
                      .insert(rows);
                    if (error) {
                      toast.error("Bildirim kaydedilemedi");
                      return;
                    }
                    setIsSendDialogOpen(false);
                    toast.success("Gönderim kuyruğa alındı");
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Gönder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {upcomingPayments.length}
                </p>
                <p className="text-xs text-slate-400">Yaklaşan Ödeme</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/20 p-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {overduePayments.length}
                </p>
                <p className="text-xs text-slate-400">Gecikmiş</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">124</p>
                <p className="text-xs text-slate-400">SMS Bu Ay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">89</p>
                <p className="text-xs text-slate-400">E-posta Bu Ay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="bg-slate-800 w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="send"
            className="data-[state=active]:bg-slate-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Gönder
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-slate-700"
          >
            <History className="mr-2 h-4 w-4" />
            Geçmiş
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-slate-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4">
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="bg-slate-800">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-slate-700"
              >
                Yaklaşan ({upcomingPayments.length})
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="data-[state=active]:bg-slate-700"
              >
                Gecikmiş ({overduePayments.length})
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-slate-700"
              >
                Tümü
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  7 gün içinde ödemesi olan öğrenciler
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 bg-transparent"
                  onClick={selectAllUpcoming}
                >
                  Tümünü Seç
                </Button>
              </div>
              <div className="space-y-3">
                {upcomingPayments.map((due) => {
                  const daysLeft = Math.ceil(
                    (new Date(due.dueDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Card
                      key={due.id}
                      className="border-slate-800 bg-slate-900"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedStudents.includes(due.studentId)}
                            onCheckedChange={() =>
                              toggleStudentSelection(due.studentId)
                            }
                            className="border-slate-600 data-[state=checked]:bg-blue-600"
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              name={due.student?.fullName}
                              className="bg-blue-500/20 text-blue-400"
                            />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-medium text-white truncate">
                                  {due.student?.fullName}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {(
                                    (due.computedAmount ?? due.amount) -
                                    (due.paidAmount || 0)
                                  ).toLocaleString("tr-TR")}{" "}
                                  TL
                                </p>
                              </div>
                              <Badge className="bg-amber-500/20 text-amber-400 shrink-0">
                                {daysLeft} gün
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {upcomingPayments.length === 0 && (
                  <div className="py-8 text-center text-slate-400">
                    7 gün içinde ödemesi olan öğrenci yok
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="overdue" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Ödeme tarihi geçmiş öğrenciler
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 bg-transparent"
                  onClick={selectAllOverdue}
                >
                  Tümünü Seç
                </Button>
              </div>
              <div className="space-y-3">
                {overduePayments.map((due) => {
                  const daysOverdue = Math.ceil(
                    (Date.now() - new Date(due.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Card
                      key={due.id}
                      className="border-slate-800 bg-slate-900"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedStudents.includes(due.studentId)}
                            onCheckedChange={() =>
                              toggleStudentSelection(due.studentId)
                            }
                            className="border-slate-600 data-[state=checked]:bg-blue-600"
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              name={due.student?.fullName}
                              className="bg-red-500/20 text-red-400"
                            />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-medium text-white truncate">
                                  {due.student?.fullName}
                                </h3>
                                <p className="text-sm text-slate-400">
                                  {due.amount.toLocaleString("tr-TR")} TL
                                </p>
                              </div>
                              <Badge className="bg-red-500/20 text-red-400 shrink-0">
                                {daysOverdue} gün gecikti
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {overduePayments.length === 0 && (
                  <div className="py-8 text-center text-slate-400">
                    Gecikmiş ödeme bulunmuyor
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Tüm aktif öğrenciler</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 bg-transparent"
                  onClick={() => setSelectedStudents(students.map((s) => s.id))}
                >
                  Tümünü Seç
                </Button>
              </div>
              <div className="space-y-3">
                {students.map((student) => (
                  <Card
                    key={student.id}
                    className="border-slate-800 bg-slate-900"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() =>
                            toggleStudentSelection(student.id)
                          }
                          className="border-slate-600 data-[state=checked]:bg-blue-600"
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            name={student.fullName}
                            className="bg-slate-700 text-slate-300"
                          />
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">
                            {student.fullName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {student.phone ||
                              student.email ||
                              "İletişim bilgisi yok"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Son gönderilen bildirimler</p>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 bg-transparent"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
          </div>
          <div className="space-y-3">
            {notificationHistory.map((log) => (
              <Card key={log.id} className="border-slate-800 bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          log.type === "sms"
                            ? "bg-emerald-500/20"
                            : log.type === "email"
                            ? "bg-blue-500/20"
                            : "bg-purple-500/20"
                        }`}
                      >
                        {getChannelIcon(log.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {log.template}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {log.recipientCount} alıcı •{" "}
                          {new Date(log.sentAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">
                          {log.successCount}
                        </span>
                        {log.failCount > 0 && (
                          <>
                            <XCircle className="ml-2 h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-400">
                              {log.failCount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">SMS Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">SMS Gönderim Aktif</p>
                  <p className="text-sm text-slate-400">
                    SMS bildirimleri gönderilebilir
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="rounded-lg bg-slate-800/50 p-4 space-y-2">
                <p className="font-medium text-white">SMS Bakiyesi</p>
                <p className="text-2xl font-bold text-emerald-400">1,250 SMS</p>
                <p className="text-sm text-slate-400">Tahmini 0.25 TL/SMS</p>
                <Button
                  size="sm"
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  Bakiye Yükle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Otomatik Bildirim Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">
                    7 Gün Önce Hatırlatma
                  </p>
                  <p className="text-sm text-slate-400">
                    Ödeme tarihinden 7 gün önce otomatik hatırlatma
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">
                    3 Gün Önce Hatırlatma
                  </p>
                  <p className="text-sm text-slate-400">
                    Ödeme tarihinden 3 gün önce otomatik hatırlatma
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">Gecikme Bildirimi</p>
                  <p className="text-sm text-slate-400">
                    Ödeme geciktiğinde otomatik bildirim
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Action Bar */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-4 md:left-auto md:right-4 md:w-auto">
          <Card className="border-blue-500/50 bg-blue-950/90 backdrop-blur">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm text-white">
                <span className="font-bold">{selectedStudents.length}</span>{" "}
                öğrenci seçildi
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 bg-transparent"
                  onClick={() => setSelectedStudents([])}
                >
                  İptal
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsSendDialogOpen(true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
const supabase = createClient();

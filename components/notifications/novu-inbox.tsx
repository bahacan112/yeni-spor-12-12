"use client";

import { Inbox } from "@novu/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
// Import the dark theme from novu
// Note: If `@novu/react/themes` causes issues, we fallback to appearance variables.
import { dark } from "@novu/react/themes";

interface NovuInboxProps {
  subscriberId?: string;
}

export function NovuInbox({ subscriberId }: NovuInboxProps) {
  const appId = process.env.NEXT_PUBLIC_NOVU_APP_ID;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // API route proxy ile CORS bypass
  const backendUrl = "/api/novu-proxy";
  const wsUrl = process.env.NEXT_PUBLIC_NOVU_WS_URL || "https://novu-ws.mysportschool.com";

  useEffect(() => {
    setMounted(true);
    console.log("[NovuInbox] appId:", appId, "subscriberId:", subscriberId, "backendUrl:", backendUrl);
  }, [appId, subscriberId]);

  if (!appId || !subscriberId) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  // To prevent hydration mismatch, only render Inbox once mounted
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Inbox
      applicationIdentifier={appId}
      subscriberId={subscriberId}
      backendUrl={backendUrl}
      socketUrl={wsUrl}
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
      }}
      // Channel label Türkçe override - globals.css'de CSS ile yapılıyor
      renderBell={(props) => {
        // Safe check for props to avoid TypeError: Cannot read properties of undefined
        let unreadCount = 0;
        if (typeof props === 'number') {
          unreadCount = props;
        } else if (props && typeof props === 'object' && 'unreadCount' in props) {
          unreadCount = (props as any).unreadCount || 0;
        }

        return (
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        );
      }}
      localization={{
        "locale": "tr-TR",
        // Inbox filtreleri
        "inbox.filters.dropdownOptions.unread": "Sadece okunmamış",
        "inbox.filters.dropdownOptions.default": "Okunmamış ve okunmuş",
        "inbox.filters.dropdownOptions.archived": "Arşivlenenler",
        "inbox.filters.dropdownOptions.snoozed": "Ertelenenler",
        "inbox.filters.labels.unread": "Okunmamış",
        "inbox.filters.labels.default": "Gelen Kutusu",
        "inbox.filters.labels.archived": "Arşiv",
        "inbox.filters.labels.snoozed": "Ertelenenler",
        // Bildirimler
        "notifications.emptyNotice": "Şimdilik sessiz. Daha sonra tekrar kontrol edin.",
        "notifications.actions.readAll": "Tümünü okundu işaretle",
        "notifications.actions.archiveAll": "Tümünü arşivle",
        "notifications.actions.archiveRead": "Okunanları arşivle",
        "notifications.newNotifications": ({ notificationCount }: { notificationCount: number }) =>
          `${notificationCount > 99 ? "99+" : notificationCount} yeni bildirim`,
        // Tekil bildirim aksiyonları
        "notification.actions.read.tooltip": "Okundu işaretle",
        "notification.actions.unread.tooltip": "Okunmadı işaretle",
        "notification.actions.archive.tooltip": "Arşivle",
        "notification.actions.unarchive.tooltip": "Arşivden çıkar",
        "notification.actions.snooze.tooltip": "Ertele",
        "notification.actions.unsnooze.tooltip": "Ertelemeyi kaldır",
        // Tercihler
        "preferences.title": "Bildirim Tercihleri",
        "preferences.global": "Genel Tercihler",
        "preferences.workflow.disabled.notice": "Bu kritik bildirim için abonelik yönetimini etkinleştirmek üzere yöneticinize başvurun.",
        "preferences.workflow.disabled.tooltip": "Düzenlemek için yöneticiye başvurun",
        "preferences.group.info": "Bu gruptaki tüm bildirimlere uygulanır.",
        // Zamanlama (Schedule)
        "preferences.schedule.title": "Zamanlama",
        "preferences.schedule.info": "Kritik ve uygulama içi bildirimler, zamanlama dışında da size ulaşır.",
        "preferences.schedule.description": "Bildirimleri belirlenen saatler arasında göster. Zamanlama dışındaki bildirimlerin harici kanallara iletilmesi duraklatılır. Uygulama içi ve kritik bildirimler her zaman iletilir.",
        "preferences.schedule.allowNotificationsBetween": "Bildirim saatleri:",
        "preferences.schedule.days": "Günler",
        "preferences.schedule.from": "Başlangıç",
        "preferences.schedule.to": "Bitiş",
        "preferences.schedule.copyTimesTo": "Saatleri kopyala",
        "preferences.schedule.sunday": "Pazar",
        "preferences.schedule.monday": "Pazartesi",
        "preferences.schedule.tuesday": "Salı",
        "preferences.schedule.wednesday": "Çarşamba",
        "preferences.schedule.thursday": "Perşembe",
        "preferences.schedule.friday": "Cuma",
        "preferences.schedule.saturday": "Cumartesi",
        "preferences.schedule.dayScheduleCopy.title": "Saatleri kopyala:",
        "preferences.schedule.dayScheduleCopy.selectAll": "Tümünü seç",
        "preferences.schedule.dayScheduleCopy.apply": "Uygula",
        // Erteleme (snooze)
        "snooze.datePicker.timePickerLabel": "Saat",
        "snooze.datePicker.apply": "Uygula",
        "snooze.datePicker.cancel": "İptal",
        "snooze.datePicker.pastDateTooltip": "Seçilen zaman en az 3 dakika ileride olmalıdır",
        "snooze.datePicker.noDateSelectedTooltip": "Lütfen bir tarih seçin",
        "snooze.datePicker.exceedingLimitTooltip": ({ days }: { days: number }) =>
          `Seçilen zaman şu andan itibaren ${days === 1 ? "24 saati" : `${days} günü`} aşamaz`,
        "snooze.options.anHourFromNow": "Bir saat sonra",
        "snooze.options.customTime": "Özel zaman...",
        "snooze.options.inOneDay": "Yarın",
        "snooze.options.inOneWeek": "Gelecek hafta",
      } as any}
    />
  );
}

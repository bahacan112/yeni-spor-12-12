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
    />
  );
}

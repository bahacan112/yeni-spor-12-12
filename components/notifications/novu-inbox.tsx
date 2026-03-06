"use client";

import { Inbox } from "@novu/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface NovuInboxProps {
  subscriberId?: string;
}

export function NovuInbox({ subscriberId }: NovuInboxProps) {
  const appId = process.env.NEXT_PUBLIC_NOVU_APP_ID;
  const apiUrl = process.env.NEXT_PUBLIC_NOVU_API_URL || "https://novu-api.mysportschool.com";

  const wsUrl = process.env.NEXT_PUBLIC_NOVU_WS_URL || "https://novu-ws.mysportschool.com";

  useEffect(() => {
    console.log("[NovuInbox] appId:", appId, "subscriberId:", subscriberId, "apiUrl:", apiUrl, "wsUrl:", wsUrl);
  }, [appId, subscriberId, apiUrl, wsUrl]);

  if (!appId || !subscriberId) {
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
      backendUrl={apiUrl}
      socketUrl={wsUrl}
    />
  );
}

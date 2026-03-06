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

  // API route proxy ile CORS bypass
  const backendUrl = "/api/novu-proxy";
  const wsUrl = process.env.NEXT_PUBLIC_NOVU_WS_URL || "https://novu-ws.mysportschool.com";

  useEffect(() => {
    console.log("[NovuInbox] appId:", appId, "subscriberId:", subscriberId, "backendUrl:", backendUrl);
  }, [appId, subscriberId]);

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
      backendUrl={backendUrl}
      socketUrl={wsUrl}
    />
  );
}

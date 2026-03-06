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

  // Proxy üzerinden CORS bypass — Next.js rewrites ile aynı domain'den geçiyor
  const backendUrl = "/novu-api";
  const wsUrl = "/novu-ws";

  useEffect(() => {
    console.log("[NovuInbox] appId:", appId, "subscriberId:", subscriberId, "backendUrl:", backendUrl, "wsUrl:", wsUrl);
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

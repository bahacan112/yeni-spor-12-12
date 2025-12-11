"use client";

import { Button } from "@/components/ui/button";

export default function DirectionsButton({
  destination,
}: {
  destination: string;
}) {
  if (!destination) return null;
  const onClick = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod|Macintosh/.test(ua) && !/Android/.test(ua);
    const dest = encodeURIComponent(destination);
    const url = isIOS
      ? `https://maps.apple.com/?daddr=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    try {
      window.open(url, "_blank");
    } catch {}
  };
  return <Button onClick={onClick}>Yol Tarifi Al</Button>;
}

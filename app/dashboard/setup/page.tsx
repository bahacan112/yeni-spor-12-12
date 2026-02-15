import { getSetupStatus } from "@/lib/api/setup";
import Link from "next/link";
import SetupClient from "./setup-client";

export default async function SetupPage() {
  const setup = await getSetupStatus();
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Kurum Kurulum Süreci</h1>
        <p className="text-sm text-muted-foreground">Durum: {setup.status}</p>
      </div>
      <SetupClient tenantId={setup.tenantId} initialSteps={setup.steps} />
    </div>
  );
}

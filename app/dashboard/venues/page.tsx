import { getVenuesData } from "@/lib/api/venues";
import { VenuesClient } from "./venues-client";

export default async function VenuesPage() {
  const { venues, tenantId, branches } = await getVenuesData();
  return (
    <VenuesClient
      initialVenues={venues}
      tenantId={tenantId}
      branches={branches}
    />
  );
}

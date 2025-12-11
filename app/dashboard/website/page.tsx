import { Suspense } from "react";
import { getWebsiteData } from "@/lib/api/website";
import WebsiteClient from "./website-client";

export const metadata = {
  title: "Web Sitesi Ayarları",
  description: "Web sitesi yönetimi",
};

export default async function WebsiteSettingsPage() {
  const { tenant, homePage, aboutPage, contactPage, branchesPage } =
    await getWebsiteData();

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <WebsiteClient
        tenant={tenant}
        homePage={homePage}
        aboutPage={aboutPage}
        contactPage={contactPage}
        branchesPage={branchesPage}
      />
    </Suspense>
  );
}

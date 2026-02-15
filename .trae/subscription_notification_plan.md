# Abonelik Bildirim Sistemi Planı (Dittofeed)

## Amaç

- Platforma üye okullar için kurumsal abonelik (TenantSubscription) bildirim akışlarını standartlaştırmak.
- Dittofeed üzerinden kimlik (identify) ve olay (track) verilerini tek tip şemalarla üretmek.
- Yönetici (admin) için abonelik olaylarını tetikleme ve kimlik tanımlama kullanımını tarif etmek.

## Veri Modeli ve İlişkiler

- Temel tablolar:
  - `tenants` (okul/kurum)
  - `platform_plans` (paketler)
  - `tenant_subscriptions` (kurum aboneliği)
  - `tenant_payments` (kurum ödemeleri)
  - `users` (platform kullanıcıları; roller: `super_admin`, `tenant_admin` vb.)
- İlişkiler:
  - `tenant_subscriptions.tenant_id -> tenants.id`
  - `tenant_subscriptions.plan_id -> platform_plans.id`
  - `tenant_payments.tenant_id -> tenants.id`
  - `tenant_payments.subscription_id -> tenant_subscriptions.id`
  - `users.tenant_id -> tenants.id`

## Kimlik Tanımlama (Identify)

- ID formatı: `table_name:tenant_id:user:id`
  - Örnek (tenant admin): `users:0b8f...-tenant:user:6a91...-user`
  - Örnek (super_admin): `users:platform:user:6a91...-user`
- Özellikler (traits) önerisi:
  - `email` (zorunlu değil ama tavsiye edilir)
  - `fullName`
  - `role` (`tenant_admin` veya `super_admin`)
  - `tenantId` (super_admin için `platform`)
  - `tenantName` (varsa)
- Kod:
  - `lib/dittofeed/identify/tenant.ts` içinde:
    - `sendIdentifyTenantAdmin({ tenantId, userId, traits })`
    - `sendIdentifySuperAdmin({ userId, traits })`

## Olaylar (Track)

- Etkinlik anahtarları (Dittofeed):
  - `TenantSubscriptionCreated`
  - `TenantSubscriptionRenewalUpcoming`
  - `TenantSubscriptionExpired`
  - `TenantSubscriptionCancelled`
  - `TenantPaymentCompleted`
  - `TenantPaymentFailed`
  - `TenantPlanChanged`
  - `TenantAutoRenewToggled`
  - `TenantTrialWillEnd`
- Ortak özellikler (properties) önerisi:
  - `tenantId`, `tenantName`
  - `planId`, `planName`
  - `billingPeriod` (`monthly` / `yearly`)
  - `amount`, `paymentMethod`
  - `currentPeriodStart`, `currentPeriodEnd`, `renewalDate`, `cancelledAt`
  - `status` (`active` / `expired` / `cancelled` / `suspended`)
  - `autoRenew` (boolean), `isTrial` (boolean), `trialDays` (number|null)
  - `invoiceNo`, `description`
- Kod:
  - `lib/dittofeed/events/tenant-subscription.ts` içinde:
    - `sendTenantSubscriptionCreated({ tenantId, userId, props })`
    - `sendTenantSubscriptionRenewalUpcoming({ tenantId, userId, props })`
    - `sendTenantSubscriptionExpired({ tenantId, userId, props })`
    - `sendTenantSubscriptionCancelled({ tenantId, userId, props })`
    - `sendTenantPaymentCompleted({ tenantId, userId, props })`
    - `sendTenantPaymentFailed({ tenantId, userId, props })`
    - `sendTenantPlanChanged({ tenantId, userId, props })`
    - `sendTenantAutoRenewToggled({ tenantId, userId, props })`
    - `sendTenantTrialWillEnd({ tenantId, userId, props })`
- Kullanılan ID oluşturma:
  - `lib/dittofeed/utils.ts`: `buildUserIdFromParts("users", tenantId || "platform", userId)`

## Admin Kullanım Dokümantasyonu

- Kimlik tanımlama:
  ```ts
  import {
    sendIdentifyTenantAdmin,
    sendIdentifySuperAdmin,
  } from "@/lib/dittofeed/identify";
  await sendIdentifyTenantAdmin({
    tenantId: "TENANT_UUID",
    userId: "USER_UUID",
    traits: {
      email: "admin@okul.com",
      fullName: "Okul Admin",
      role: "tenant_admin",
      tenantName: "Okul",
    },
  });
  await sendIdentifySuperAdmin({
    userId: "ADMIN_UUID",
    traits: {
      email: "admin@platform.com",
      fullName: "Platform Admin",
      role: "super_admin",
    },
  });
  ```
- Abonelik olay tetikleme:
  ```ts
  import {
    sendTenantSubscriptionCreated,
    sendTenantPaymentCompleted,
  } from "@/lib/dittofeed/events";
  await sendTenantSubscriptionCreated({
    tenantId: "TENANT_UUID",
    userId: "ADMIN_UUID",
    props: {
      tenantName: "Okul",
      planId: "PLAN_UUID",
      planName: "Pro",
      billingPeriod: "monthly",
      amount: 199,
      currentPeriodStart: "2025-01-01T00:00:00Z",
      currentPeriodEnd: "2025-02-01T00:00:00Z",
      status: "active",
      autoRenew: true,
    },
  });
  await sendTenantPaymentCompleted({
    tenantId: "TENANT_UUID",
    userId: "ADMIN_UUID",
    props: {
      amount: 199,
      paymentMethod: "credit_card",
      invoiceNo: "INV-2025-0001",
      description: "Ocak 2025 abonelik ödemesi",
    },
  });
  ```
- Alternatif olarak HTTP uçları:
  - Identify: `POST /api/integrations/dittofeed/events` body:
    ```json
    {
      "type": "identify",
      "userId": "users:TENANT_UUID:user:USER_UUID",
      "traits": {
        "email": "admin@okul.com",
        "role": "tenant_admin",
        "tenantId": "TENANT_UUID"
      }
    }
    ```
  - Track: `POST /api/integrations/dittofeed/events` body:
    ```json
    {
      "type": "track",
      "userId": "users:TENANT_UUID:user:USER_UUID",
      "event": "TenantSubscriptionCreated",
      "properties": { "planName": "Pro", "billingPeriod": "monthly" }
    }
    ```

## Notlar

- `super_admin` için `tenantId` değeri `platform` olarak kullanılmalıdır.
- Kimlik ve olay gönderiminde `userId` güvenli hale getirilir; geçersiz karakterler `_` ile normalize edilir.
- SMTP ve Journey tarafı Dittofeed paneli/adminden yönetilmeli; olay anahtarları yukarıdaki isimlerle eşlenmelidir.

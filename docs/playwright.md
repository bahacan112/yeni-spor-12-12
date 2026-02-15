Sen kıdemli bir E2E test mimarısın.
Bu projede Playwright tabanlı, production’dan tamamen izole edilmiş,
local ortamda çalışan profesyonel bir E2E test sistemi kuracaksın.

⚠️ ÇOK ÖNEMLİ KURALLAR:

- Test kodları production bundle’a GİRMEYECEK
- Testler production ortamda ÇALIŞMAYACAK
- Admin panel SADECE test sonuçlarını OKUYACAK
- Admin panel testleri TETİKLEMEYECEK
- Testler SADECE local terminalden çalıştırılacak
- Tüm yapı .gitignore ile prod’dan izole edilecek

---

## 1️⃣ KLASÖR VE PROJE YAPISI

Ana proje dizini altında aşağıdaki yapıyı oluştur:

/e2e
/tests
auth.spec.ts
admin-login.spec.ts
reservation-flow.spec.ts
guide-assignment.spec.ts
critical-flows.spec.ts
/pages
LoginPage.ts
DashboardPage.ts
ReservationPage.ts
/utils
auth.helper.ts
wait.helper.ts
playwright.config.ts
package.json
README.md
output/
last-run.json

Kurallar:

- e2e klasörü ana uygulamadan BAĞIMSIZ çalışmalı
- Kendi package.json’u olacak
- Kendi node_modules’u olacak
- Ana uygulamanın koduna import edilmeyecek

---

## 2️⃣ GIT & PROD İZOLASYONU

Ana proje .gitignore dosyasına şunları EKLE:

/e2e
!/e2e/output/last-run.json

Kurallar:

- Tüm test kodları git tarafından görmezden gelinecek
- SADECE test sonuç JSON’u repo’da kalacak
- Production build sırasında e2e klasörü YOK SAYILACAK

---

## 3️⃣ PLAYWRIGHT KONFİGÜRASYONU

- Playwright sadece Chromium kullanacak
- Headless = true
- BaseURL = http://localhost:3000
- SlowMo = 0
- Timeout = global ve test bazlı ayarlanacak

Test koşulları:

- Login gerektiren akışlarda storageState kullanılacak
- Testler paralel çalışabilecek ama order bağımlılığı OLMAYACAK

---

## 4️⃣ TEST AKIŞLARI (E2E)

Aşağıdaki AKIŞLARI eksiksiz yaz:

### AUTH

- Admin login
- Yanlış şifre
- Token/session doğrulama

### ADMIN PANEL

- Dashboard açılıyor mu
- Yetkisiz erişim engelleniyor mu

### REZERVASYON

- Rezervasyon listesi yükleniyor
- Filtreleme çalışıyor
- Detay panel açılıyor

### REHBER

- Rehber atanıyor
- Aynı gruba tekrar atanamıyor
- Atama siliniyor

### KRİTİK AKIŞLAR

- Boş veri durumu
- API error fallback
- Unauthorized redirect

Her test:

- Açık isimli
- Deterministic
- Bağımsız
- Retry-safe olacak

---

## 5️⃣ TEST SONUÇLARI (JSON OUTPUT)

Playwright test run sonunda aşağıdaki formatta
`/e2e/output/last-run.json` dosyasını üret:

{
"runAt": "ISO_DATE",
"environment": "local",
"summary": {
"total": 12,
"passed": 10,
"failed": 2
},
"tests": [
{
"name": "Admin login works",
"status": "passed",
"durationMs": 1200
},
{
"name": "Unauthorized access blocked",
"status": "failed",
"error": "Expected redirect to /login"
}
]
}

---

## 6️⃣ ADMIN PANEL – READ ONLY UI

Admin panel tarafında:

- Sadece `/e2e/output/last-run.json` okunacak
- Test ÇALIŞTIRMA butonu OLMAYACAK
- UI sadece görselleştirme yapacak

UI gereksinimleri:

- Son çalıştırma zamanı
- Başarılı / başarısız test sayısı
- Test listesi (renkli: yeşil/kırmızı)
- Hata mesajları expandable olacak

⚠️ Admin panel Playwright’ı BİLMEYECEK.
Sadece JSON okuyacak.
json sonuçları modern bir sayfada test rotası altında gösterilecek. json formatı ui şablonuna yazılacak.

---

## 7️⃣ ÇALIŞTIRMA

Local terminalden:

cd e2e
pnpm install
pnpm run test

Ana proje:

- Bu komutlardan HABERSİZ olacak
- CI/CD pipeline’da ÇALIŞMAYACAK

---

## 8️⃣ DOKÜMANTASYON

---

❌ ŞUNLARI YAPMA:

- Admin panelden test çalıştırma
- Playwright’ı backend’e bağlama
- Prod’da test koşturma
- Test kodlarını build’e sokma

🎯 AMAÇ:

- Profesyonel
- İzole
- Güvenli
- Debuggable
- Prod’a sıfır risk

Bu sistemi uçtan uca KODLAYARAK oluştur.
Hiçbir adımı atlama.
Varsayım yapma.
Kestirme yapma.

---

## 9️⃣ KAPSAMLI SİSTEM RAPORU

Amaç:

- Kurulum adımlarının tamamlanma durumu
- Operasyonel modüllerin erişilebilirliği ve yönlendirme kuralları
- Temel sayfaların açılış süreleri ve hata yakalama
- Kritik veritabanı tablolarının varlığına dair smoke kontrol (UI akışı üzerinden)
- Sonuçların JSON ve HTML raporlarıyla tek dosyada özetlenmesi

Rapor Üretimi:

- Playwright `reporter` olarak hem JSON hem HTML kullanılacak.
- JSON dosyası yolu: `/e2e/output/last-run.json`
- HTML raporu: `/e2e/output/html-report`

Örnek Playwright Konfigürasyonu:

```
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [
    ['json', { outputFile: 'output/last-run.json' }],
    ['html', { outputFolder: 'output/html-report', open: 'never' }],
  ],
});
```

JSON Şeması:

```
{
  "runAt": "ISO_DATE",
  "environment": {
    "baseURL": "http://localhost:3000",
    "browser": "chromium",
    "headless": true
  },
  "summary": {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "durationMs": 0
  },
  "setupStatus": {
    "status": "Başlanmadı|Devam Ediyor|Tamamlandı",
    "currentStepIndex": 0,
    "steps": [
      { "key": "branches", "completed": false, "count": 0 },
      { "key": "instructors", "completed": false, "count": 0 },
      { "key": "sports", "completed": false, "count": 0 },
      { "key": "groups", "completed": false, "count": 0 },
      { "key": "venues", "completed": false, "count": 0 },
      { "key": "students", "completed": false, "count": 0 },
      { "key": "trainings", "completed": false, "count": 0 }
    ]
  },
  "modules": [
    { "name": "Dashboard", "status": "ok|redirect|error", "ttfbMs": 0 },
    { "name": "Applications", "status": "ok|redirect|error", "ttfbMs": 0 },
    { "name": "Trainings", "status": "ok|redirect|error", "ttfbMs": 0 },
    { "name": "Attendance", "status": "ok|redirect|error", "ttfbMs": 0 },
    { "name": "Calendar", "status": "ok|redirect|error", "ttfbMs": 0 },
    { "name": "Reports", "status": "ok|redirect|error", "ttfbMs": 0 },
    { "name": "Accounting", "status": "ok|redirect|error", "ttfbMs": 0 }
  ],
  "checks": [
    { "name": "AuditLogsPresentViaUIFlow", "result": "pass|fail", "notes": "" },
    { "name": "StudentGroupsFlowFunctional", "result": "pass|fail", "notes": "" },
    { "name": "SportMigrationVisible", "result": "pass|fail", "notes": "" }
  ],
  "tests": [
    { "name": "Admin login works", "status": "passed", "durationMs": 0 },
    { "name": "Unauthorized access blocked", "status": "failed", "error": "..." }
  ],
  "errors": [
    { "name": "Global", "message": "", "stack": "" }
  ]
}
```

Kapsamlı Sistem Akışları:

- Kurulum Durumu:
  - `/dashboard/setup` sayfasına gidilir.
  - Adım kartlarının tamamlanma durumu ve mevcut sayıları toplanır.
  - `lib/api/setup.ts:1` mantığındaki step anahtarlarıyla eşleştirilir.
- Operasyonel Modül Gating:
  - Kurulum tamamlanana kadar modüller için redirect kontrolü yapılır (`/dashboard/trainings`, `/dashboard/attendance`, `/dashboard/calendar`, `/dashboard/reports`).
  - Dashboard erişimi gate kontrolüne tabi (`app/dashboard/page.tsx:15`).
- Kritik UI Smoke Kontrolleri:
  - Başvurular `/dashboard/applications` yükleniyor mu, boş/teknik hata durumları işleniyor mu (`lib/api/applications.ts:1`)?
  - Muhasebe ekranında insert akışı butonları render ediliyor mu (`app/dashboard/accounting/accounting-client.tsx:150`)?
- DB İpuçları UI Üzerinden:
  - `audit_logs` hatası guard ile UI akışında oluşmamalı; submit sonrası hata yoksa “pass”.
  - `student_groups` akışı: grup ve öğrenci oluşturup ilişkilendirme UI akışında sorun yoksa “pass”.
  - Spor migrasyonu görünürlüğü: grup listelerinde spor alanları görünürse “pass”.

Çalıştırma ve Rapor Alma:

- Terminal:
  - `cd e2e && pnpm install && pnpm run test`
- Sonuçlar:
  - JSON: `/e2e/output/last-run.json`
  - HTML: `/e2e/output/html-report/index.html`

Admin Panel Entegrasyonu:

- Read‑Only rapor ekranı JSON’u okur, test çalıştırmaz.
- Görselleştirme:
  - Son çalıştırma zamanı ve toplam süre
  - Başarılı/başarısız test sayısı
  - Modül durumları (ok/redirect/error) ve TTFB
  - Setup adım özetleri (tamamlanma ve count)
  - Hata mesajları (expandable)

İzolasyon ve Güvenlik:

341→- Test kodları production build’e girmeyecek.
342→- Admin panel Playwright’ı bilmeyecek, sadece JSON okuyacak.
343→- Tetikleme tuşu olmayacak, tüm süreç yalnızca local terminalden.
344→
345→---
346→
347→## 🔟 TEST EDİLECEK BİLEŞENLER
348→
349→Bu liste, E2E kapsamı için etkileşimli (client) ekranları ve kullanıcıya dönük önemli sayfaları içerir. Her öğe, Playwright ile sayfa yükleme, yetkilendirme/redirect, form girişleri, tablo/filtreleme ve CRUD butonları etkileşimlerinin test kapsamına alınmalıdır.
350→
351→AUTH
352→
353→- `app/auth/login/page.tsx`
354→- `app/auth/register/page.tsx`
355→- `app/auth/forgot-password/page.tsx`
356→- `app/auth/reset-password/page.tsx`
357→- `app/auth/verify-email/page.tsx`
358→- `app/auth/verify-phone/page.tsx`
359→- `app/auth/logout/page.tsx`
360→- `app/auth/layout.tsx`
361→
362→DASHBOARD
363→
364→- `app/dashboard/page.tsx`
365→- `app/dashboard/layout.tsx`
366→- `app/dashboard/applications/applications-client.tsx`
367→- `app/dashboard/applications/page.tsx`
368→- `app/dashboard/students/students-client.tsx`
369→- `app/dashboard/students/page.tsx`
370→- `app/dashboard/students/[id]/student-detail-client.tsx`
371→- `app/dashboard/students/[id]/page.tsx`
372→- `app/dashboard/instructors/instructors-client.tsx`
373→- `app/dashboard/instructors/page.tsx`
374→- `app/dashboard/sports/sports-client.tsx`
375→- `app/dashboard/sports/page.tsx`
376→- `app/dashboard/groups/groups-client.tsx`
377→- `app/dashboard/groups/page.tsx`
378→- `app/dashboard/groups/[id]/group-detail-client.tsx`
379→- `app/dashboard/groups/[id]/page.tsx`
380→- `app/dashboard/trainings/trainings-client.tsx`
381→- `app/dashboard/trainings/page.tsx`
382→- `app/dashboard/attendance/attendance-client.tsx`
383→- `app/dashboard/attendance/page.tsx`
384→- `app/dashboard/calendar/calendar-client.tsx`
385→- `app/dashboard/calendar/page.tsx`
386→- `app/dashboard/reports/reports-client.tsx`
387→- `app/dashboard/reports/page.tsx`
388→- `app/dashboard/accounting/accounting-client.tsx`
389→- `app/dashboard/accounting/page.tsx`
390→- `app/dashboard/accounting/policy/policy-client.tsx`
391→- `app/dashboard/accounting/policy/page.tsx`
392→- `app/dashboard/general-accounting/general-accounting-client.tsx`
393→- `app/dashboard/general-accounting/general-accounting-stats.tsx`
394→- `app/dashboard/general-accounting/page.tsx`
395→- `app/dashboard/general-accounting/store-sales/store-sales-client.tsx`
396→- `app/dashboard/general-accounting/store-sales/page.tsx`
397→- `app/dashboard/products/products-client.tsx`
398→- `app/dashboard/products/page.tsx`
399→- `app/dashboard/orders/orders-client.tsx`
400→- `app/dashboard/orders/page.tsx`
401→- `app/dashboard/payment-history/payments-client.tsx`
402→- `app/dashboard/payment-history/page.tsx`
403→- `app/dashboard/subscriptions/subscriptions-client.tsx`
404→- `app/dashboard/subscriptions/page.tsx`
405→- `app/dashboard/notifications/notifications-client.tsx`
406→- `app/dashboard/notifications/page.tsx`
407→- `app/dashboard/venues/venues-client.tsx`
408→- `app/dashboard/venues/page.tsx`
409→- `app/dashboard/branches/branches-client.tsx`
410→- `app/dashboard/branches/page.tsx`
411→- `app/dashboard/registration-links/registration-links-client.tsx`
412→- `app/dashboard/registration-links/page.tsx`
413→- `app/dashboard/dues/dues-client.tsx`
414→- `app/dashboard/dues/page.tsx`
415→- `app/dashboard/website/website-client.tsx`
416→- `app/dashboard/website/page.tsx`
417→- `app/dashboard/settings/settings-client.tsx`
418→- `app/dashboard/settings/page.tsx`
419→- `app/dashboard/setup/setup-client.tsx`
420→- `app/dashboard/setup/page.tsx`
421→- `app/dashboard/more/page.tsx`
422→
423→ADMIN
424→
425→- `app/admin/page.tsx`
426→- `app/admin/layout.tsx`
427→- `app/admin/users/users-client.tsx`
428→- `app/admin/users/page.tsx`
429→- `app/admin/subscriptions/subscriptions-client.tsx`
430→- `app/admin/subscriptions/page.tsx`
431→- `app/admin/payments/payments-client.tsx`
432→- `app/admin/payments/page.tsx`
433→- `app/admin/schools/schools-client.tsx`
434→- `app/admin/schools/page.tsx`
435→- `app/admin/schools/[id]/school-detail-client.tsx`
436→- `app/admin/schools/[id]/page.tsx`
437→- `app/admin/plans/plans-client.tsx`
438→- `app/admin/plans/page.tsx`
439→- `app/admin/reports/reports-client.tsx`
440→- `app/admin/reports/page.tsx`
441→- `app/admin/notifications/notifications-client.tsx`
442→- `app/admin/notifications/page.tsx`
443→- `app/admin/settings/settings-client.tsx`
444→- `app/admin/settings/page.tsx`
445→
446→INSTRUCTOR
447→
448→- `app/instructor/page.tsx`
449→- `app/instructor/layout.tsx`
450→- `app/instructor/groups/page.tsx`
451→- `app/instructor/groups/[id]/page.tsx`
452→- `app/instructor/attendance/page.tsx`
453→- `app/instructor/attendance/[id]/page.tsx`
454→- `app/instructor/trainings/page.tsx`
455→- `app/instructor/analytics/page.tsx`
456→- `app/instructor/settings/page.tsx`
457→
458→TENANT WEBSITE / E‑COMMERCE
459→
460→- `app/site/[slug]/page.tsx`
461→- `app/site/[slug]/magaza/page.tsx`
462→- `app/site/[slug]/magaza/[productSlug]/page.tsx`
463→- `app/site/[slug]/sepet/page.tsx`
464→- `app/site/[slug]/siparisler/page.tsx`
465→- `app/site/[slug]/kayit/page.tsx`
466→- `app/kayit/[code]/page.tsx`
467→
468→CHECKOUT
469→
470→- `app/checkout/success/page.tsx`
471→- `app/checkout/error/page.tsx`
472→
473→LANDING
474→
475→- `app/(landing)/page.tsx`
476→- `app/(landing)/layout.tsx`
477→- `app/(landing)/about/page.tsx`
478→- `app/(landing)/features/page.tsx`
479→- `app/(landing)/pricing/page.tsx`
480→
481→HATA & YÜKLEME SAYFALARI
482→
483→- `app/error.tsx`
484→- `app/global-error.tsx`
485→- `app/not-found.tsx`
486→- `app/dashboard/error.tsx`
487→- `app/dashboard/loading.tsx`
488→- `app/dashboard/students/loading.tsx`
489→- `app/dashboard/instructors/loading.tsx`
490→- `app/dashboard/products/loading.tsx`
491→- `app/dashboard/dues/loading.tsx`
492→- `app/dashboard/notifications/loading.tsx`
493→- `app/dashboard/registration-links/loading.tsx`
494→- `app/dashboard/groups/loading.tsx`
495→- `app/admin/error.tsx`
496→- `app/admin/users/loading.tsx`
497→- `app/admin/subscriptions/loading.tsx`
498→- `app/admin/payments/loading.tsx`
499→- `app/admin/schools/loading.tsx`
500→- `app/instructor/analytics/loading.tsx`
501→- `app/instructor/groups/loading.tsx`
502→- `app/instructor/groups/[id]/loading.tsx`
503→- `app/site/[slug]/loading.tsx`
504→- `app/site/[slug]/magaza/loading.tsx`
505→- `app/site/[slug]/kayit/loading.tsx`
506→
507→ORTAK BİLEŞENLER – LAYOUT
508→
509→- `components/layout/sidebar.tsx`
510→- `components/layout/breadcrumbs.tsx`
511→- `components/layout/mobile-header.tsx`
512→- `components/layout/mobile-nav.tsx`
513→- `components/error-boundary.tsx`
514→- `components/theme-provider.tsx`
515→
516→DASHBOARD BİLEŞENLERİ
517→
518→- `components/dashboard/nav-cards.tsx`
519→- `components/dashboard/stats-cards.tsx`
520→- `components/dashboard/pending-payments.tsx`
521→- `components/dashboard/today-trainings.tsx`
522→- `components/dashboard/recent-applications.tsx`
523→- `components/dashboard/quick-actions.tsx`
524→
525→ÖĞRENCİ BİLEŞENLERİ
526→
527→- `components/students/payment-sheet.tsx`
528→
529→WEBSITE / SITE BİLEŞENLERİ
530→
531→- `components/site/product-detail.tsx`
532→- `components/site/cart-view.tsx`
533→- `components/site/directions-button.tsx`
534→
535→LANDING BİLEŞENLERİ
536→
537→- `components/landing/header.tsx`
538→- `components/landing/footer.tsx`
539→
540→MEDYA
541→
542→- `components/media/image-uploader.tsx`
543→
544→UI KİT (ŞABLON BİLEŞENLER)
545→
546→- `components/ui/accordion.tsx`
547→- `components/ui/alert.tsx`
548→- `components/ui/alert-dialog.tsx`
549→- `components/ui/aspect-ratio.tsx`
550→- `components/ui/avatar.tsx`
551→- `components/ui/badge.tsx`
552→- `components/ui/breadcrumb.tsx`
553→- `components/ui/button.tsx`
554→- `components/ui/button-group.tsx`
555→- `components/ui/calendar.tsx`
556→- `components/ui/card.tsx`
557→- `components/ui/carousel.tsx`
558→- `components/ui/chart.tsx`
559→- `components/ui/checkbox.tsx`
560→- `components/ui/collapsible.tsx`
561→- `components/ui/command.tsx`
562→- `components/ui/context-menu.tsx`
563→- `components/ui/dialog.tsx`
564→- `components/ui/drawer.tsx`
565→- `components/ui/dropdown-menu.tsx`
566→- `components/ui/empty.tsx`
567→- `components/ui/field.tsx`
568→- `components/ui/form.tsx`
569→- `components/ui/hover-card.tsx`
570→- `components/ui/input.tsx`
571→- `components/ui/input-group.tsx`
572→- `components/ui/input-otp.tsx`
573→- `components/ui/item.tsx`
574→- `components/ui/kbd.tsx`
575→- `components/ui/label.tsx`
576→- `components/ui/menubar.tsx`
577→- `components/ui/navigation-menu.tsx`
578→- `components/ui/pagination.tsx`
579→- `components/ui/popover.tsx`
580→- `components/ui/progress.tsx`
581→- `components/ui/radio-group.tsx`
582→- `components/ui/resizable.tsx`
583→- `components/ui/scroll-area.tsx`
584→- `components/ui/separator.tsx`
585→- `components/ui/sheet.tsx`
586→- `components/ui/sidebar.tsx`
587→- `components/ui/skeleton.tsx`
588→- `components/ui/slider.tsx`
589→- `components/ui/sonner.tsx`
590→- `components/ui/spinner.tsx`
591→- `components/ui/switch.tsx`
592→- `components/ui/table.tsx`
593→- `components/ui/tabs.tsx`
594→- `components/ui/textarea.tsx`
595→- `components/ui/toast.tsx`
596→- `components/ui/toaster.tsx`
597→- `components/ui/toggle.tsx`
598→- `components/ui/toggle-group.tsx`
599→- `components/ui/tooltip.tsx`
600→- `components/ui/use-mobile.tsx`
601→
602→DİĞER
603→
604→- `app/components/ui/inbox/NovuInbox.tsx`
605→- `components/skeletons.tsx`
606→
607→Notlar:
608→
609→- E2E testleri, “client” bileşenlerde form/flow ve görünürlük doğrulamalarını kapsamalıdır.
610→- “loading”, “error” ve “not-found” sayfaları smoke testleri ile doğrulanmalıdır.
611→- Admin ve Dashboard modülleri için kurulum gating’i ve yetkilendirme redirect’leri mutlaka test edilmelidir.

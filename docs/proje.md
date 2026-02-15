Genel Durum

- Mimari: Next.js App Router + Supabase (çoklu tenant), servis rolü ile arka plan işleri, yönetim paneli ve dashboard sayfaları mevcut.
- Modüller: Paketler ( platform_plans ), abonelikler ( tenant_subscriptions ), ödemeler ( tenant_payments ), öğrenciler, gruplar, şubeler, eğitmenler, website ve e‑ticaret bileşenleri, bildirim logları, platform ayarları.
- Otomasyon: Yenileme ve dunning işleri için arka plan job’ları eklendi; Supabase Edge Function akışı hazır.
- Yetkilendirme: Admin tarafında super_admin guard’ı var; özellik bazlı UI kısıtlamaları başlatıldı (ör. website , ecommerce ).
- Trial: Plan bazında “trial açılabilir” ve varsayılan gün; okul için trial oluşturma akışı eklendi.
  Örnek referanslar:

- Abonelik tahsilat otomasyonu: app/api/jobs/subscription-charge/route.ts:43 , Edge Function: supabase/functions/subscription_charge/index.ts:1
- Paket CRUD ve trial alanları: app/api/admin/plans/route.ts:72 , app/api/admin/plans/[id]/route.ts:28 , lib/api/admin.ts:259
- Limit guard’lar: app/dashboard/groups/groups-client.tsx:366 , app/dashboard/students/students-client.tsx:144
- Trial başlatma API/UI: app/api/admin/subscriptions/trial/route.ts:1 , app/admin/schools/[id]/school-detail-client.tsx:579
  Güçlü Noktalar

- Tamamlanmış CRUD akışları ve RBAC koruması (admin planlar).
- Arka plan iş mantığı (yenileme/dunning) ile yaşam döngüsü yönetimi.
- Limit guard’ları ile kullanım sınırlarının temel korunması.
- Plan bazlı özellik kapatma için UI tarafında gating.
- Raporlar: son 6 ay için gelir, yeni okul, aktif okul sayıları birleştiriliyor ( lib/api/admin.ts:549 ).
  Kritik Eksikler (Güvenlik ve Doğrulama)

- Tenant izolasyonu (RLS): Tablolarda satır‑bazlı politika eksikleri muhtemel. tenant_id alanı olan tüm tablolar için Supabase RLS policy zorunlu (okuma/yazma, rol bazlı).
- Sunucu tarafı özellik kısıtlaması: UI gating var; ancak backend uçları süreçleri özelliğe göre engellemiyor. Örn. website için server route yok; sadece UI’de website-client.tsx:362 kısıt.
- İş idempotensi ve eşzamanlılık: Yenileme job’larında tekrar çalıştırma ve çakışma engeli yok (iş kilidi, idempotent anahtar, “already processed” kontrolü).
- Abonelik tekilliği: “Bir tenant’a 1 aktif abonelik” kuralı için benzersiz indeks/kısıt önerilir (örn. (tenant_id, status='active') unique).
- Denetim kayıtları: Yönetim işlemleri (plan değişiklik, abonelik güncelleme) için audit log tablo/akışı eksik.
  İşlevsel Eksikler (Spor Okulu Özel)

- Program ve Takvim:
  - Ders/oturum takvimi, eğitmen görevlendirme, saha/salon slot yönetimi
  - Öğrenci rezervasyonları, kapasite, bekleme listesi, yoklama/katılım takibi
- Üyelik ve sözleşmeler:
  - Üyelik türleri, dondurma/suspension, iptal ve iade akışları; prorateli plan değişimi
  - E‑imza ile sözleşme/kvkk/waiver formu
- Performans ve gelişim:
  - Antrenman planları, test sonuçları, sertifikalar/rozetler, ilerleme raporları
- İletişim ve bildirim:
  - Şablon‑tabanlı otomasyon (değişkenlerle), segmentasyon (grup/şube/yaş), iki yönlü mesajlaşma, push/SMS entegrasyonu
- Kayıt ve online başvuru:
  - Web formları, ön kayıt, otomatik sınıf yerleştirme, online ödeme ile kayıt tamamlama
- Payment gateway entegrasyonu:
  - Türkiye için iyzico/PayTR/Garanti/iyzico + global için Stripe; tekrarlı tahsilat, iade, fatura/e‑arşiv
- Personel ve bordro:
  - Eğitmen vardiya planlama, maaş/prim/komisyon, izin/tatil yönetimi
- Envanter ve mağaza:
  - Kıyafet bedenleri, stok yönetimi, teslim/zimmet; indirim/kupon, kampanya
- CRM:
  - Aday öğrenciler, satış hunisi, kampanya dönüşümü, takip hatırlatmaları
- Tesis yönetimi:
  - Salon/saha rezervasyonları, cihaz bakım planları
- Mobil/PWA:
  - Veli/öğrenci uygulaması: yoklama, takvim, ödeme, duyuru, QR ile hızlı check‑in/out
- Çoklu şube ve roller:
  - branch_manager , coach , accountant gibi rol hiyerarşisi; şube bazlı yetki ve görünürlük
- Çoklu dil/para birimi:
  - TR/EN dil ayarı, TL/€/$ para birimi, KDV oranları
- Raporlama+Analitik:
  - MRR/ARR, churn, LTV, cohort, gelir dağılımı; şube bazlı KPI panoları; dışa aktarım (CSV/Excel)
- Hukuk ve uyumluluk:

  - KVKK/GDPR veri talebi/silme, açık rıza takibi, veri saklama politikaları
    Teknik Eksikler ve İyileştirmeler

- Şema ve indeksler:
  - Yaygın sorgu alanlarına indeks: tenant_id , created_at , current_period_end , status
  - Abonelik geçmişi: tenant_subscription_events tablo (upgrade/downgrade/freeze/cancel log)
- Gateway entegrasyonu:
  - Webhook’lar: ödeme sonuçları, geri çağrılar; imza doğrulama; idempotent event işleme
- Trial politikaları:
  - Trial dönüşümü: kart eklenirse otomatik devam; trial bitiş hatırlatmaları ve sınırlama; tenant başına maksimum trial sayısı; aynı tenant için tekrar deneme engeli
- Sunucu tarafı Gating:
  - E‑ticaret ve website işlemlerinde feature enforcement backend’de (ör. ürün ekleme API’sında plan kontrolü)
- İzlenebilirlik:
  - Hata raporlama (Sentry), performans izleme, structured logs; cron ve edge function log’larının dashboard’la takip
- CI/CD ve test:
  - En azından birim testler (domain servisleri), entegrasyon testleri (API uçları), E2E (kritik akışlar: kayıt→ödeme→katılım)
- Güvenlik:
  - 2FA, parola politikaları, IP rate limiting, CSRF koruması (Next.js formları), içerik güvenliği
- Veri dışa aktarım:
  - CSV/Excel export endpoint’leri (rapor sayfaları), şube/tenant filtreleri
- Feature flags:
  - Kademeli yayın, deneme özellikleri, platform_settings ile basit toggles; rollout yüzdeleri
- İş akışları ve sıra:

  - Bildirim gönderimi için kuyruk (rate limit ve retriable); uzun işlemler için job queue (Edge + Durable Object veya dış queue)
    Öncelikli Yol Haritası

- Kritik güvenlik ve veri bütünlüğü
  - Supabase RLS policy’leri (tenant_id bazlı) ve role tabanlı erişim; “tek aktif abonelik” kuralı için unique constraint
  - Backend feature gating: website , ecommerce , kayıt oluşturma gibi uçlarda plan özelliği kontrolü
  - Job idempotensi ve iş kilitleme; yenilemelerde “zaten işlenmiş” kontrolü
- Ödeme ve faturalama
  - Entegre gateway (iyzico/Stripe) + webhook; abonelik yönetimi (fail/retry/cancel/refund)
  - Fatura/e‑arşiv akışı; vergi/KDV alanları, para birimi yönetimi
- Operasyonel çekirdek
  - Ders takvimi + yoklama; rezervasyon/kapasite; bekleme listesi; eğitmen atama
  - Üyelik sözleşmeleri ve dondurma/suspension akışları
- İletişim ve otomasyon
  - Şablon sistemini (notification_templates) genişletmek, değişken motoru, segmentasyon; SMS/Push entegrasyonları
- Analitik ve raporlar
  - KPI panoları (MRR/ARR/churn/LTV) + şube kıyas; export
- Mobil/PWA ve CRM

  - Veli/öğrenci PWA (yoklama, ödeme, takvim) ve temel CRM (lead→öğrenci dönüşümü)
    Hızlı Kazanımlar (Uygulamaya Dönüştürmesi Kolay)

- RLS ve indeksler: Her tablo için tenant_id RLS; kritik sorgu alanlarına indeks.
- Backend gating: Ürün ve website API’larında plan özellik denetimi (UI’de yaptığımızın server tarafı muadili).
- Trial politikası: Tekrar trial engeli, bitiş hatırlatma şablonları (notification logs’den otomatik gönderim).
- Abonelik tekilliği: Unique veya “aktif abonelik” view + constraint.
- Export: Admin raporlarının CSV/Excel export’u.
  İsterseniz, bu eksiklerin her biri için ayrıntılı teknik plan, şema önerisi ve dosya/dizin bazlı uygulanacak değişiklik listesi hazırlayıp adım adım hayata geçirebilirim. Örneğin “RLS ve Backend Feature Gating” ile başlamak, sonra “Takvim/Yoklama + Payment Gateway” aşamasına geçmek en etkili sıralama olacaktır.

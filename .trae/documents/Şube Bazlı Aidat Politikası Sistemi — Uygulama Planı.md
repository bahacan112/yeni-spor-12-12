## Kapsam
- Şube bazlı, takvim ayı temelli aidat hesaplama motoru
- Politikalar: Sabit, İlk Ay Kalan Ders, Minimum Katılım, Dondurma
- Çakışma önceliği: Dondurma veya Katılım
- UI: Muhasebe altında “Aidat Politikası” sayfası ve butonu
- Veri: Politika ayarları, öğrenci dondurma ayları, katılım özetleri

## Veritabanı
- `branch_fee_policies` (yeni)
  - `tenant_id`, `branch_id`
  - `fee_model` (`fixed | first_month_remaining | min_participation`)
  - `freeze_enabled` (bool), `freeze_before_month_start_only` (bool)
  - `yearly_freeze_limit` (int), `freeze_fee_policy` (`free | percent50 | justified_only_free`)
  - `planned_lessons_per_month` (int)
  - `min_full_attendance` (int)
  - `discount_range_min` (int), `discount_range_max` (int), `discount_fee_percent` (int)
  - `free_range_max` (int)
  - `conflict_priority` (`freeze_first | attendance_first`)
  - `created_at`, `updated_at`
  - RLS: `tenant_id` ve `branch_id` ile izolasyon
- `student_month_freezes` (yeni)
  - `tenant_id`, `branch_id`, `student_id`, `due_month` (YYYY-MM), `reason`, `justified` (bool)
  - Benzersiz: (`student_id`, `due_month`)
  - RLS: kiracı/şube izolasyonu
- `monthly_dues` (genişletme)
  - `policy_model_applied` (text)
  - `participation_count` (int)
  - `freeze_applied` (bool)
  - `applied_discount_percent` (int)
  - `computed_amount` (numeric), `original_amount` (numeric)
  - `calculation_notes` (text)
  - İndeksler: `idx_monthly_dues_branch_month`, `idx_monthly_dues_student_month`

## Fonksiyonlar (SQL)
- `compute_monthly_due(tenant_id, branch_id, student_id, due_month)`
  - Akış: dondurma kontrolü → çakışma önceliği → minimum katılım → sabit/ilk ay mantığı
  - Girdiler: politika, katılım sayısı (`attendance`), öğrenci kayıt tarihi, planlanan ders sayısı
  - Çıktı: `computed_amount`, uygulanan oran/indirim ve açıklamalar
- `generate_monthly_dues(tenant_id, branch_id, due_month)` (mevcut fonksiyonu genişlet)
  - Her öğrenci için `monthly_dues` kaydı üretir ve `compute_monthly_due` ile doldurur
- `update_overdue_status()` (mevcut) korunur; yeni `computed_amount` alanına göre işler

## Uygulama Katmanı (API)
- `GET /api/branches/{branchId}/fee-policy`: politikayı getir
- `PUT /api/branches/{branchId}/fee-policy`: politikayı güncelle
- `POST /api/branches/{branchId}/freezes`: öğrenci için ay dondurma ekle/sil
- `POST /api/branches/{branchId}/recompute-dues?month=YYYY-MM`: verilen ayı yeniden hesapla
- Supabase client ile `branch_fee_policies`, `student_month_freezes`, `monthly_dues` işlemleri
- RLS uyumu: `tenant_id` session’dan; `branch_id` sorgu parametresi

## Hesaplama Mantığı
- Dondurma kontrolü
  - `freeze_enabled` ve `student_month_freezes` var mı?
  - `freeze_before_month_start_only` koşulu; `yearly_freeze_limit` kontrolü
  - Ücret: `freeze_fee_policy` (0, %50, justified-only)
- Çakışma önceliği
  - `freeze_first`: dondurulduysa katılım yok sayılır
  - `attendance_first`: dondurma olsa bile katılım kuralları uygulanır
- Minimum katılım
  - `planned_lessons_per_month`, `participation_count` (attendance)
  - `min_full_attendance` → %100
  - `discount_range_min/max` → `discount_fee_percent`
  - `free_range_max` → %0
- İlk ay kalan ders
  - Öğrencinin kayıt olduğu ay: takvimde kalan ders sayısı × birim ders ücreti
  - Sonraki aylar sabit aidat
- Sabit aidat
  - Katılım dikkate alınmaz; politikanın sabit ücret değeri/abonelikten alınır

## UI — Muhasebe
- Sidebar/Mobile: “Muhasebe” altında “Aidat Politikası” butonu
  - Link: `/dashboard/accounting/policy?branchId=...`
- `app/dashboard/accounting/policy/page.tsx`
  - Şube seçici (mevcut `branchId` arayüzünü kullan)
  - Bölümler:
    - Aidat Modeli (A/B/C/D seçenekleri)
    - Dondurma Politikası (ON/OFF, hak, ücret, koşullar)
    - Minimum Katılım (planlanan ders, eşikler/aralıklar/indirim)
    - Kural Önceliği (freeze vs attendance)
  - Kaydet: `PUT fee-policy`
  - Önizleme: seçili kurallarla örnek senaryoları hesaplayıp göster
- Muhasebe Dashboard
  - “Ayı Hesapla”/“Yeniden Hesapla” butonu (branch + month)
  - Aidat özetleri `monthly_dues` üzerinden `computed_amount` ile

## Şube Bazlı Çalışma
- Tüm veri modelleri `tenant_id + branch_id` ile filtrelenir
- Politika kaydı bir şube için tekil: UNIQUE (`tenant_id`,`branch_id`)
- Muhasebe ve Aidatlar sayfaları `branchId` parametresiyle çalışır

## Zamanlama
- Aylık hesaplama job
  - Supabase Scheduler/Edge Function: her ay sonu `generate_monthly_dues` çağrısı
  - Manuel tetikleme: Muhasebe ekranından “Yeniden Hesapla”

## Testler
- Birim: `compute_monthly_due` için
  - Senaryolar: dondurma öncelikli, minimum katılım aralıkları, ilk ay hesap, sabit aidat
- Entegrasyon: `recompute-dues` API çağrısı; `monthly_dues` güncelleniyor mu?
- E2E: Politika formu → kaydet → ayı hesapla → raporda sonuçlar

## Güvenlik ve Performans
- RLS: tüm yeni tablolarda tenant/branch izolasyonu
- İndeksler: branch+month, student+month
- Paginated sorgular; raporlar için görünümler
- Girdi doğrulama: aralıklar ve yüzdeler için kısıtlar

## Adım Sırası
1) SQL migration: `branch_fee_policies`, `student_month_freezes`, `monthly_dues` genişletme + RLS/indeksler
2) SQL fonksiyonlar: `compute_monthly_due`, `generate_monthly_dues` genişletmesi
3) API uçları ve veri erişim servisleri
4) UI: Muhasebe altında “Aidat Politikası” sayfası ve buton
5) Job: aylık hesaplama zamanlayıcı + manuel tetikleme
6) Testler: birim/entegrasyon/E2E

## Notlar
- Mevcut dosyalarla entegrasyon: `app/dashboard/accounting/page.tsx`, `app/dashboard/dues/page.tsx`, `components/layout/sidebar.tsx`
- `monthly_dues` halihazırda şube kolonuna sahip; plan branchId ile uyumlu
- Minimum katılım için `attendance` ve `trainings` takviminden plan/gerçekleşen ders sayısı toplanır
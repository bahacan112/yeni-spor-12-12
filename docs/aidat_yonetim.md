# Aidat Yönetimi: Ekran Akışı, Hesaplama Mantığı ve Entegrasyonlar

## Genel Bakış

- Amaç: Öğrencilerin aylık aidatlarının oluşturulması, hesaplanması, görüntülenmesi ve tahsil edilmesi süreçlerini yönetmek.
- Katmanlar:
  - Backend API uçları üzerinden toplu aidat oluşturma ve hesaplama.
  - Veritabanı `RPC` fonksiyonları ile tutarlı ve performanslı hesaplama.
  - Frontend bileşenleriyle listeleme, filtreleme ve ödeme akışları.

## Veri Modelleri

- `monthly_dues`: Öğrenci bazlı aylık aidat kayıtları.
  - Önemli alanlar: `tenant_id`, `branch_id`, `student_id`, `due_month`, `due_date`, `amount`, `paid_amount`, `status`, `computed_amount`, `original_amount`, `policy_model_applied`, `participation_count`, `freeze_applied`, `applied_discount_percent`.
- `payments`: Tahsilat kayıtları; aidat ödemeleri `monthly_due_id` üzerinden ilişkilendirilir.
- Politika tablosu: `branch_fee_policies`
  - Aidat modeli ve dondurma/minimum katılım kurallarını tutar.
  - UI’den okunur/yazılır; bkz. referanslar.

## Akışlar

### 1) Toplu Aidat Oluşturma

- Ekrandan (Toplu Oluştur) seçilen ay için şube bazında aidatlar oluşturulur.
- Backend uç:
  - `app/api/branches/[branchId]/recompute-dues/route.ts:24-33`
  - Parametreler: `p_tenant_id`, `p_branch_id`, `p_due_month`
  - İş: `generate_monthly_dues_v3` RPC çağrısı ile belirtilen ay için tüm öğrencilerde `monthly_dues` kayıtlarını üretir.
- Frontend ek işlem:
  - İsteğe bağlı son ödeme tarihi (`due_date`) kullanıcı tarafından seçilirse, toplu güncelleme yapılır.
  - Referans: `app/dashboard/dues/dues-client.tsx:373-378`

### 2) Grup Bazında Aidat Oluşturma

- Seçilen gruptaki aktif öğrenciler için tek tek `monthly_dues` upsert edilir ve ardından hesaplama yapılır.
- Adımlar:
  - `upsert monthly_dues` → `compute_monthly_due_v3` RPC
  - Referans: `app/dashboard/dues/dues-client.tsx:392-411`

### 3) Aidat Listeleme ve Durumlar

- Ekranda filtreler ve istatistikler sunulur; durumlar türetilmiş veya kayıt bazlıdır:
  - `paid`, `partial`, `pending`, `overdue` (tarih karşılaştırmalarıyla).
  - Türetilmiş durum mantığı:
    - Referans: `app/dashboard/dues/dues-client.tsx:100-107`
    - Gecikmiş hesaplama: `differenceInCalendarDays(due_date, today) < 0` → `overdue`
- Listeleme veri kaynağı:
  - `lib/api/dues.ts:30-61` Supabase join ile öğrenciyi de yükler, `mapMonthlyDueFromJoin` ile tipleri normalize eder (`lib/api/dues.ts:64-88`).

### 4) Ödeme Kaydetme ve Aidat Güncelleme

- Ödeme eylemi:
  - `payments` tablosuna ekleme; ardından ilgili `monthly_dues` kaydında `paid_amount` ve `status` güncellemesi.
  - Durum: Tam veya kısmi ödendi (kalan tutar kontrolü).
  - Referans: `app/dashboard/dues/dues-client.tsx:1187-1217`

### 5) Dashboard Üst Kartlar

- Ana panoda ilk 5 bekleyen aidat gösterimi:
  - `lib/api/dashboard.ts:174-182`

## Hesaplama Mantığı

- Çekirdek hesaplama işlevleri veritabanı tarafındadır:
  - `generate_monthly_dues_v3`: Ay için toplu kayıt oluşturur.
  - `compute_monthly_due_v3`: Tek öğrencinin ilgili ay kayıtını iş kurallarına göre hesaplar.
- UI’den belirlenen `branch_fee_policies` alanları hesaplamayı etkiler:
  - Aidat modeli (`fixed`, `first_month_remaining`, `min_participation`)
  - Dondurma kuralları (`freeze_enabled`, `freeze_before_month_start_only`, `yearly_freeze_limit`, `freeze_fee_policy`)
  - Minimum katılım eşikleri ve indirim aralıkları (`planned_lessons_per_month`, `min_full_attendance`, `discount_range_min`, `discount_range_max`, `discount_fee_percent`, `free_range_max`)
  - Çakışma önceliği (`conflict_priority`)
  - Okuma/yazma uçları:
    - UI: `app/dashboard/accounting/policy/policy-client.tsx:66-92, 104-130`
    - API: `app/api/branches/[branchId]/fee-policy/route.ts:49-73`

## Vade Günü ve Guardrail Politikaları

- Vade günü politikası ve yeniden hesaplamada koruma ayarları için ek meta alanlar UI’ye eklendi:
  - Vade günü: `FIRST_DAY`, `FIXED_DAY (X)`, `FIRST_BUSINESS_DAY`, `LAST_BUSINESS_DAY`
  - Guardrails: Ödenmiş/kısmi ödenmiş kayıtları yeniden hesaplamada koruma, belirli bir gün sonrası kilitleme.
  - UI: `app/dashboard/accounting/policy/policy-client.tsx` içinde “Vade Günü Politikası” ve “Güvenlik Duvarları” kartları.
  - API uçları:
    - `app/api/branches/[branchId]/fee-policy-meta/route.ts` (GET/PUT)
    - Not: `branch_fee_policy_meta` tablosu için migrasyon gereklidir. Tablo yoksa GET `meta: null, warning: migration_required` döner; PUT `error: migration_required`.

## “Kişi farklı günlerde kayıt olursa, bir sonraki ay vade nasıl dolar?”

- Hesaplama DB fonksiyonlarıyla yapılır. Vade günü:
  - Toplu oluşturma sırasında UI’de seçilen `due_date` doğrudan kayıtlara yazılabilir (`dues-client.tsx:373-378`).
  - Eğer elle `due_date` verilmezse, varsayılan politika DB fonksiyonları veya politikalarca belirlenir.
  - Yeni “Vade Günü Politikası” ile gelecekte bu mantık merkezi ve tutarlı şekilde yönetilecektir (migration ardından `fee-policy-meta` okunarak).
- Bu davranış frontend tarafından “tarih seçimi” ile yönlendirilebilir, hesaplama ise backend/RPC tarafında uygulanır.

## Güvenlik ve Tutarlılık

- RLS: Tüm sorgular `tenant_id` bazlı kısıtlarla çalıştırılır.
- Yeniden hesaplama guardrails:
  - Ödenmiş ve kısmi ödenmiş kayıtları koruma bayrakları.
  - Ayın belirli bir gününden sonra kilitleme (ör. muhasebe kapanışı).
  - Uygulama planı: `fee-policy-meta` üzerinden ayarların DB fonksiyonlarına devredilmesi (migration sonrası).

## Test ve Doğrulama

- Lint: `pnpm run lint` başarılı.
- Tip kontrol: `pnpm exec tsc --noEmit` başarılı.
- Ekran testleri:
  - Toplu Oluştur ve Grup Bazlı Oluştur akışları.
  - Ödeme al ve aidat güncelle akışı.
  - Politika kaydetme (mevcut tablo) ve meta kaydetme (migration uyarısı).

## Kod Referansları

- Toplu oluşturma: `app/api/branches/[branchId]/recompute-dues/route.ts:24-33`
- Grup bazlı oluşturma ve hesaplama: `app/dashboard/dues/dues-client.tsx:392-411`
- Aidat listeleme ve durumlar: `app/dashboard/dues/dues-client.tsx:100-107, 681-771`
- Ödeme ve aidat güncelleme: `app/dashboard/dues/dues-client.tsx:1187-1217`
- Dashboard bekleyen aidatlar: `lib/api/dashboard.ts:174-182`
- Aidat veri kaynağı ve mapping: `lib/api/dues.ts:30-61, 64-88`
- Politika UI ve kaydetme: `app/dashboard/accounting/policy/policy-client.tsx:66-92, 104-160, 185-242`
- Politika API: `app/api/branches/[branchId]/fee-policy/route.ts:49-73`
- Meta UI ve API:
  - UI kartları: `app/dashboard/accounting/policy/policy-client.tsx` (Vade Günü ve Guardrails bölümleri)
  - API: `app/api/branches/[branchId]/fee-policy-meta/route.ts`

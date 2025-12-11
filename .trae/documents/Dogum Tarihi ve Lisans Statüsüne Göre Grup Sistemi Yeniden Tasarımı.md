## Hedef
- Grupları yaş etiketleri yerine doğum tarihi aralıklarına göre tanımla.
- Öğrencileri “Lisanslı” ve “Lisanssız” olarak iki biçimde gruplayabil.
- Atama sırasında doğum tarihi ve lisans koşullarını otomatik doğrula.

## Veritabanı Şeması
- `groups` tablosuna yeni alanlar:
  - `birth_date_from DATE NULL`
  - `birth_date_to DATE NULL`
  - `license_requirement TEXT NOT NULL DEFAULT 'any'` (değerler: `any | licensed | unlicensed`)
- `CHECK (birth_date_from <= birth_date_to)` kısıtı.
- `students` tablosuna yeni alanlar:
  - `is_licensed BOOLEAN NOT NULL DEFAULT false`
  - İsteğe bağlı ayrıntılar: `license_no VARCHAR`, `license_issued_at DATE`, `license_expires_at DATE`, `license_federation VARCHAR` (gerekiyorsa)
- Üyelik doğrulama için tetikleyici:
  - `student_groups` INSERT/UPDATE öncesi: `students.birth_date` ∈ `[groups.birth_date_from, groups.birth_date_to]` ve `groups.license_requirement` ile `students.is_licensed` uyumlu olmalı; aksi halde `RAISE EXCEPTION`.
- İndeksler:
  - `students(birth_date)`, `groups(birth_date_from, birth_date_to)`, `groups(license_requirement)`.

## İş Kuralları
- Grup oluşturma/güncelleme:
  - En az bir tarih alanı doldurulmalı; doldurulmayan alan “sınırsız” kabul edilebilir (örn. sadece `birth_date_to` → üst sınır).
  - `license_requirement` seçimi: `Herhangi`, `Sadece Lisanslı`, `Sadece Lisanssız`.
- Öğrenci–grup ataması:
  - Atama, tetikleyici ve servis katmanı tarafından doğrulanır; hatalı eşleşmeler engellenir.
- Mevcut `age_group` alanı:
  - Geçici olarak korunur (görüntü amaçlı). Yeni kayıtlar için kullanılmaz; UI’dan kaldırılır.

## API Güncellemeleri
- `lib/data-service.ts`:
  - `mapGroup` genişlet: `birth_date_from`, `birth_date_to`, `license_requirement` (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\lib\data-service.ts:577–596)
  - `mapStudent` genişlet: `is_licensed` ve lisans ayrıntıları (mevcut `birthDate` eşlemesi korunur)
- `lib/api/groups.ts`:
  - Oluşturma/güncelleme uçları için yeni alanların kabulü ve doğrulaması (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\lib\api\groups.ts:22–66, ~100–149)
- `lib/api/students.ts`:
  - `is_licensed` alanını okuma/yazma desteği; seçimlerde filtreleme opsiyonu (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\lib\api\students.ts:41–51, 110–137, 177–193)
- Üyelik ekleme noktası:
  - Öğrenci oluşturma sonrası `student_groups` ekleme öncesi servis doğrulaması (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\app\dashboard\students\students-client.tsx:165–175)

## UI Güncellemeleri
- Grup oluşturma/düzenleme formu (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\app\dashboard\groups\groups-client.tsx:21–50, 101–137):
  - `ageGroup` girişini kaldır.
  - `birthDateFrom` ve `birthDateTo` için iki tarih seçici ekle.
  - `licenseRequirement` için seçim alanı: `Herhangi/Lisanslı/Lisanssız`.
- Grup liste ve detay:
  - Kartlarda tarih aralığını ve lisans gereksinimini göster (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\app\dashboard\groups\groups-client.tsx:264–278)
- Öğrenci formu/listesi:
  - `isLicensed` anahtarı; rozet ve filtre ekle (c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\app\dashboard\students\students-client.tsx, c:\Users\baha\Desktop\Projeler\yeni-spor-okulu\app\dashboard\students\[id]\student-detail-client.tsx)

## Migrasyon ve Geriye Uyumluluk
- Mevcut gruplar için geçici dönüşüm:
  - `age_group` “X–Y yaş” → `birth_date_from = today - Y years`, `birth_date_to = today - X years`.
  - `license_requirement = 'any'` olarak varsayılan.
- Raporlama/UI’da eski `age_group` metni, yeni tarih aralığıyla birlikte geçici olarak gösterilebilir.
- Tohum verileri güncelle: `scripts/005-seed-data.sql` içine örnek lisanslı/lisanssız öğrenciler ve tarih aralıklı gruplar.

## Testler
- Birim testleri:
  - Doğrulama yardımcıları (tarih aralığı, lisans uyumu).
- Entegrasyon testleri:
  - Grup oluşturma/güncelleme ve öğrenci–grup ataması akışları.
  - Tetikleyici kısıtlarının ihlalinde hata üretildiğinin doğrulanması.
- E2E (isteğe bağlı):
  - UI formlarında lisans ve tarih aralığıyla atama.

## Güvenlik ve Kısıtlar
- Supabase RLS politikalarını güncelle:
  - `student_groups` insert/update için tenant izolasyonu ve kural uyumu.
- Tetikleyici/constraint ile veri bütünlüğü korunur; servis tarafı kontrolleri kullanıcıya anlaşılır hata mesajları döner.

## Performans
- İndeksler ve basit aralık sorguları ile ölçeklenebilirlik.
- Listeleme uçlarında sayfalama ve filtreler korunur.

## Etkilenen Dosyalar
- Şema/Migrasyon: `scripts/001-create-schema.sql`, `scripts/004-complete-schema.sql`, `scripts/005-seed-data.sql`
- API/Servis: `lib/api/groups.ts`, `lib/api/students.ts`, `lib/data-service.ts`, `lib/types.ts`
- UI: `app/dashboard/groups/groups-client.tsx`, `app/dashboard/students/students-client.tsx`, `app/dashboard/students/[id]/student-detail-client.tsx`

## Onay Sonrası Adımlar
1. Şema migrasyonlarını yaz ve uygula.
2. API ve tip güncellemelerini yap.
3. UI formlarını ve gösterimleri güncelle.
4. Eski verileri dönüştür ve doğrula.
5. Testleri çalıştır ve hataları gider.

Onaylarsanız, derhal uygulamaya başlayabilirim.
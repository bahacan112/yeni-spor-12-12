## Hedefler
1) Öğrenciler, gruplar, sahalar, muhasebe ve aidat takibi şube bazlı yönetilsin; her şubenin muhasebesi ayrı tutulabilsin.
2) Eğitmenler ve sahalar tenant bazlı görünsün; website ve ürün/katalog tamamen tenant bazlı olsun.
3) Sahalar ve eğitmenler tüm şubelerde listelenebilir/atanabilir olsun (grup/antrenman atamaları mümkün).
4) Mantık hataları analiz edilip gerekli tasarım kararları uygulansın.

## Şema Düzenlemeleri
- Monthly Dues (aidat): `monthly_dues` tablosuna `branch_id UUID NOT NULL REFERENCES branches(id)` ekle; yaratımda öğrencinin o anki şubesini snapshot olarak yaz.
- Muhasebe: `payments`, `expenses`, `orders` tablolarda `branch_id`’yi zorunlu hale getir (mevcut veriler için migrasyon: ilişkilerden türet veya ana şubeye set).
- Sahalar (venues): Tenant bazlı görünürlük için `venues.branch_id`’yi opsiyonel hale getir (NULL → tüm şubelerde görünür). Şube bazlı özel saha gerekiyorsa `branch_id` doldurulabilir.
- Eğitmenler: `instructors` tenant bazlı kalır; `instructor_branches` sadece opsiyonel kısıtlama için (gerekirse). Atama kuralları tenant seviyesinde doğrulanır.
- Website tabloları: `website_pages`, `announcements`, `product_categories`, `products`, `product_variants` tenant bazlı kalır; branch alanı eklenmez.
- Indeks/RLS: `branch_id` eklenen tablolara indeks ekle; RLS tenant izolasyonu korunur.

## Lib ve Servis Katmanı
- Tipler (`lib/types.ts`): `MonthlyDue`’a `branchId`; `Venue.branchId` opsiyonel; `Payment/Expense/Order.branchId` zorunluluğunu artır.
- API/Service (`lib/api/*`, `lib/data-service.ts`):
  - Fonksiyonlara `branchId?: string` parametresi ekle.
  - Şube bazlı olan listelerde `.eq("branch_id", branchId)` uygula; sahalar ve eğitmenlerde tenant bazlı listeleme (branch filtresi yok veya isteğe bağlı).
  - Insert/update akışlarında `branch_id` zorunlu alanları set et; default `currentBranch.id`.

## UI Güncellemeleri
- Header şube seçimi: Mevcut mekanizmayı koru; seçimde URL parametresi (`?branch=<id>`) ile server render’ı tetikle.
- Dashboard: `getDashboardData(branchId)` ile istatistikler ve Bugünkü Antrenmanlar şube bazlı.
- Listeleme sayfaları: Öğrenci/Grup/Antrenman/Muhasebe sayfaları `currentBranch` filtresi ile çalışır.
- Formlar: Yeni kayıt formlarında `branch_id` default `currentBranch.id`; Eğitmen/Saha seçimleri tenant bazlı listeden yapılır.
- Atama: Grup/Antrenman oluştururken eğitmen ve saha, aynı tenant’tan serbestçe atanabilir.

## Yapılabilirlik ve Mantık Analizi
- Global saha/eğitmen: Tenant bazlı listeleme uygundur; şube bazlı raporlar etkilenmez. Çakışma/yetkinlik planlaması için ileride “müsaitlik/rezervasyon” sistemi eklenebilir.
- Aidat şube bazlı: Dönemsel şube değişimlerinde snapshot mantığı doğru; geçmiş raporlar tutarlı kalır.
- Attendance: Şube, `training_id` üzerinden türetildiği için normalizasyon korunur.

## Geçiş ve Test
- Migrasyon: Eski veriler için `branch_id` doldurma stratejisi (öğrenciden/ilişkiden türet veya ana şube).
- Tip kontrol: `tsc --noEmit`.
- Manuel test: Şube değiştir → dashboard/liste/form akışları.

Onayınızla bu planı uygulayarak şube bazlı yönetim ve tenant bazlı website yapısını, global eğitmen/saha görünürlüğüyle birlikte hayata geçireceğim.
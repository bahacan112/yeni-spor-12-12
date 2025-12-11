## Bulgu Özeti
- Aidat kayıtları ve ödeme akışı çoğu ekranda çalışır; tüm veriler `amount/paidAmount` üzerinden gösteriliyor.
- Politika metaverileri (`computed_amount`, `original_amount`, `applied_discount_percent`, `freeze_applied`, `participation_count`, `calculation_notes`) UI’de görünmüyor.
- Şube bağlamı bazı akışlarda kullanılmıyor; `payments` insert’te `branch_id` eksik olabilir.
- Bekleyen ödeme metriği `sum(amount)` üzerinden; kısmi ödemelerde kalan borcu tam yansıtmaz.

## Kanıtlar
- Dues listesi ve ödeme: `app/dashboard/dues/dues-client.tsx:639–736` ödeme insert + `monthly_dues` güncelleme yapıyor.
- Öğrenci detay ödeme özeti: `app/dashboard/students/[id]/student-detail-client.tsx:108–115, 224–267`.
- Pending ödemeler kartı: `components/dashboard/pending-payments.tsx:52–102` sadece `amount`/`paidAmount` gösteriyor.
- Bildirimler: `app/dashboard/notifications/notifications-client.tsx:594` `amount` gösterimi.
- Payment Sheet: `components/students/payment-sheet.tsx:24, 46` kalan tutarı hesaplıyor; insert satırı yok (ödemeler dues-client içinde yapılıyor).

## İyileştirme Adımları
1) Politika metaverilerini UI’ye ekle
- Dues kartlarına `originalAmount` vs `computedAmount` ve indirim/dondurma rozetleri ekle.
- Öğrenci detayında ilgili ay için uygulanan politika (`policyModelApplied`) ve `calculationNotes` göster.

2) Şube bağlamını standartlaştır
- Ödeme eklerken `payments.branch_id = selectedDue.branchId` alanını set et.
- Dues ve ödeme sayfalarında şube etiketi/filtre göster.

3) Bekleyen ödeme metriğini düzelt
- Muhasebe: `pendingPayments` değerini `sum(amount - paid_amount)` olarak hesapla.
- Pending kartlarda “Kalan” tutarı vurgula.

4) Tip ve veri eşlemeleri
- `MonthlyDue` tipinde yeni alanların mapping’ini veri servislerine ekle; UI’ler bu alanları kullansın.

5) Doğrulama
- Kısmi/tam ödeme, dondurma ve indirimli senaryolarla UI kontrolü; şube bazlı filtre doğrulaması.

## Sonuç
- Bu düzenlemelerle politika etkisi UI’de görünür olacak, şube çoklu kullanımda veri bütünlüğü artacak ve bekleyen ödeme metrikleri gerçeğe uygun hesaplanacaktır.
# Aylık Grup İşletim Akışı (Okul Sahibi İçin)

## Amaç

- Ay boyunca grupları, yoklamayı ve aidatları düzenli yönetmek.
- Veli iletişimini zamanında yapmak ve tahsilatı artırmak.
- Sistem politikalarıyla tutarlı, şeffaf ve denetlenebilir bir süreç işletmek.

## Ön Hazırlık (Ay Başında)

- Politikaları ayarla:
  - Aidat modeli ve dondurma kuralları: `Dashboard → Muhasebe → Aidat Politikası`
  - Minimum katılım eşikleri ve indirim yüzdeleri
  - Vade günü politikası (örn. Ayın 10’u), yeniden hesaplama guardrails
- Grupları ve takvimi düzenle:
  - Aylık planlanan ders sayısı ve eğitmen atamaları
  - Haftalık ders gün/saatlerinin sisteme girilmesi
- Şube/tenant doğrulamaları:
  - Aktif gruplar ve kontenjanlar
  - Eksik öğrenci bilgileri (telefon/e‑posta) ve gruplara atamalar

## Hafta Hafta Örnek Akış

- Hafta 1
  - Kayıtları ve grup atamalarını tamamla.
  - Yoklamayı her ders bitiminde gir.
  - Politika ekranını gözden geçir: planlanan ders (örn. 8), “tam aidat için minimum” (örn. 4), indirim aralıkları.
- Hafta 2
  - Yeni kayıt veya grup değişiklikleri varsa uygula.
  - Dondurma taleplerini (raporlu vb.) kurala göre değerlendir.
  - “Aidat Takibi” ekranında mevcut ayın durumu ve gecikmeleri kontrol et.
- Hafta 3
  - Bir sonraki ay için vade günü yaklaşırken hatırlatma planla.
  - “Bildirimler” ekranı üzerinden; segment: “bekleyen/gelecek ay aidat”.
- Hafta 4
  - “Aidat Takibi → Toplu Oluştur” ile bir sonraki ayın aidatlarını üret.
  - Son ödeme tarihini (örn. 10’u) belirle ve gerekirse toplu güncelle.
  - Velilere hatırlatma gönder, tahsilatları kaydet ve statüleri güncelle.

## Sistem Ekranlarıyla Adımlar

- Aidat Takibi
  - Liste/filtre/istatistik: bekleyen, gecikmiş, ödenen
  - “Toplu Oluştur”: şube veya grup bazında ay seçimi ve vade günü belirleme
  - “Ödeme Al”: aidatla ilişkili ödeme kaydı ve statü güncellemesi
- Muhasebe → Aidat Politikası
  - Aidat modeli (sabit, ilk ay kalan ders, minimum katılım)
  - Dondurma kuralları (ör. sadece ay başlamadan)
  - Vade günü politikası ve guardrails (ödenmişleri koru, kilit günü)
- Yoklama/Takvim
  - Ders planı ve güncel yoklamalar (gün içinde işleyip birikme önle)
- Bildirimler
  - Hatırlatma şablonları ve son ödeme yaklaşan segmentler

## Örnek Senaryo

- Grup: U12 Karate, aylık planlanan ders: 8, aylık ücret: 800 TL.
- Öğrenci Mehmet 13’ünde kayıt olur:
  - Aidat modeli “İlk Ay Kalan Ders” ise: ilk ay kalan ders sayısına göre oranlama.
  - Örn. ilk ay kalan ders 6 ise: 6/8 × 800 TL = 600 TL.
- Vade günü politikası “Ayın 10’u”: bir sonraki ayın aidat vade günü 10’u olarak belirlenir.
- Dondurma (raporlu) “%50 ücret” ise: ilgili ayın hesaplamasında 400 TL yansır.
- Yeni ayda minimum katılım “4” ise; katılım 2 ise indirim aralığına göre (ör. %50) indirim uygulanır.

## En İyi Uygulamalar

- Yoklamayı aynı gün gir; kilit gününden sonra geriye dönük giriş yapma.
- “Toplu Oluştur”u ayın son haftasında çalıştır; vade gününü netleştir.
- Guardrails ile ödenmiş/kısmi ödenmiş kayıtların yanlışlıkla yeniden hesaplanmasını engelle.
- Hatırlatmaları vade gününden 3–5 gün önce ve vade gününde planla.
- Ödemeleri “Ödeme Al” üzerinden gir; aidat statüsü otomatik güncellensin.

## Kontrol Listesi

- [ ] Aidat politikaları güncel mi?
- [ ] Gruplar ve planlanan ders sayıları girildi mi?
- [ ] Vade günü belirlendi mi? (örn. 10’u)
- [ ] Bir sonraki ay aidatları “Toplu Oluştur” ile üretildi mi?
- [ ] Hatırlatmalar planlandı ve gönderildi mi?
- [ ] Ödemeler kaydedildi ve statüler güncel mi?

## Sık Sorulanlar

- “Vade günü nasıl belirleniyor?”
  - Politika ekranındaki “Vade Günü” ayarıyla; toplu oluşturma sırasında son ödeme tarihi de belirlenebilir.
- “İlk ay neden farklı tutar çıkabiliyor?”
  - “İlk Ay Kalan Ders” modelinde kalan derse göre oranlama yapılır.
- “Dondurma talebi nasıl yansır?”
  - Dondurma politikasına göre (ücretsiz/%50/raporlu) ilgili ayın ücretine etki eder.
- “Gecikmiş nasıl hesaplanıyor?”
  - Son ödeme tarihine göre; tarih geçtiğinde “gecikmiş” statüsüne düşer ve hatırlatma yapılabilir.

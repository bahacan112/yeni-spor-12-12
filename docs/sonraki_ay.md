# Sonraki Ay Aidatı — Basit Mantık Açıklaması

## Amaç

- Bir öğrencinin bir sonraki ay başladığında aidatının nasıl “hazırlandığını” ve ay ilerledikçe borcunun nasıl “takip edildiğini” yalın bir mantıkla anlatır.

## Zaman Çizelgesi

- Ay Başlangıcı:
  - Yeni ay için her aktif öğrenciye bir aidat kaydı açılır.
  - Bu kayıt başlangıçta “Bekliyor” durumundadır.
  - Ödeme son tarihi (`due_date`) ayın başlangıcı veya belirlenen ödeme gününe ayarlanır.
- Ay İçinde:
  - Öğrenci veya veli ödeme yaptıkça “ödenen tutar” artar.
  - Kayıt “kısmi” veya “ödendi” durumlarına geçebilir.
- Ay Sonu / Son Tarih Geçince:
  - Ödeme tamamlanmamışsa kayıt “gecikmiş” statüsüne düşer.

## Basit Tutar Mantığı

- Baz Tutar:
  - Öğrencinin aktif olduğu grupların aylık ücretlerinin toplamı veya aktif abonelikteki aylık tutar esas alınır.
- İndirim/Özel Düzenleme:
  - Varsa öğrenciye tanımlı sabit tutar veya yüzde indirim uygulanır.
- Politika Etkileri:
  - Şube politikası gereği ilk ay için “kalan ders” modeli, katılım sayısına göre indirim/bedava, ay dondurma (askıya alma) gibi kurallar fiyatı değiştirebilir.
- Sonuç:
  - Bu adımların sonunda “hesaplanan tutar” elde edilir ve takip bu tutar üzerinden yapılır.

## Durumlar

- Bekliyor:
  - Yeni ay aidatları bu statü ile başlar.
- Kısmi:
  - Bir kısmı ödendiyse bu statüye geçer.
- Ödendi:
  - Toplam tutar tamamen karşılandıysa “ödendi” olur.
- Gecikmiş:
  - Ödeme tarihi geçtiği halde tamamlanmadıysa “gecikmiş” görünür.

## Takip Nasıl Yapılır?

- Kalan Tutar:
  - “Hesaplanan/Toplam” tutardan “ödenen” düşülerek kalan hesaplanır.
- Hatırlatmalar:
  - Gecikme veya yaklaşan ödeme tarihi için bildirim/hatırlatma süreçleri kullanılabilir.
- Görünürlük:
  - Liste ekranlarında ay bazında “ödenen / toplam” gösterilir.
  - Öğrenci detayında geçmiş aylar ve mevcut ayın durumu tek tek izlenir.

## Özel Durumlar

- Ay Dondurma:
  - Politika uygun ise, ilgili ay için ücret tamamen veya kısmen düşebilir.
- İlk Ay:
  - Kayıt tarihi ay içinde ise “kalan ders” yaklaşımı ile orantılı ücret uygulanabilir.
- İndirim/Override:
  - Yetkili kullanıcılar belirli bir tarih aralığı için sabit tutar veya yüzde indirim tanımlayabilir.

## Özet

- Yeni ay başında tüm aktif öğrenciler için “bekliyor” durumlu aidat kaydı açılır.
- Baz ücret ve varsa indirim/politika etkileriyle “hesaplanan tutar” ortaya çıkar.
- Ödeme aldıkça durum ve kalan tutar güncellenir; tarih geçerse “gecikmiş” olur.
- Tüm süreç öğrencinin liste ve detay ekranlarında basit şekilde izlenir.

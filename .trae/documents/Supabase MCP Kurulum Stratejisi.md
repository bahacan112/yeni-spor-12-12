# Bağlantı Testi Planı

Yapılandırmayı tamamladığınızı belirttiniz. Şimdi veritabanı bağlantısını test etmek için PostgreSQL MCP aracını kullanmayı deneyeceğim.

1.  **Versiyon Kontrolü:**
    `SELECT version();` sorgusunu çalıştırarak veritabanına erişim sağlayıp sağlayamadığımı kontrol edeceğim.

2.  **Tablo Listeleme:**
    Eğer bağlantı başarılıysa, `public` şemasındaki tabloları listeyerek (`SELECT * FROM information_schema.tables...`) doğru veritabanında olduğumuzu doğrulayacağım.

Hemen testi başlatıyorum.
# Veritabanı Durum Raporu (Supabase/PostgreSQL)

Tarih: 2025-12-30

## Genel Özet
- PostgreSQL: 15.8 (db: postgres)
- Ana uzantılar: pg_cron, pg_graphql, pg_net, pg_stat_statements, pgcrypto, pgsodium, supabase_vault
- Şemalar: public (46 tablo), auth (16), storage (5), cron (2), supabase_functions (2) vb.
- PK mevcut, birçok FK kolonunda indeks eksikleri var
- RLS aktif tablolar çok, ancak tenant_id bulunan bazı tablolarda RLS kapalı
- Görünümler çalışır durumda; 1 materyalize görünüm ispopulated=true
- Cron işlerinden “bildirim gönderimi” başarısız

## Şemalar ve Tablolar
- İş yükünün çoğu public şemasında
- Public tabloların tamamında PK mevcut
- Tablolarda updated_at sütunu yaygın; tetikleyici (trigger) eksikleri var

## İndeks ve Kısıt Analizi
- Bulgular: FK kolonları için indeks eksiklikleri yaygın. Bu durum JOIN ve DELETE/UPDATE performansını düşürür, FK kontrol maliyetlerini artırır.
- Kritik örnekler:
  - monthly_dues(subscription_id, tenant_id)
  - payments(order_id, monthly_due_id, received_by, student_id)
  - orders(student_id, customer_id)
  - order_items(order_id, product_id, variant_id)
  - trainings(venue_id, branch_id, instructor_id, tenant_id)
  - students(user_id)
  - user_sessions(user_id, instructor_id)
  - products(category_id), product_variants(product_id), product_categories(parent_id, tenant_id)
  - registration_links(branch_id, created_by, group_id, tenant_id)
  - notification_logs(template_id), notification_templates(tenant_id)
- Öneri: Bütün FK kolonlarına B-Tree indeks eklenmeli

## Görünümler ve Materyalize Görünümler
- Public görünümler: v_attendance_summary, v_instructor_summary, v_monthly_revenue, v_student_payment_status, v_tenant_stats
  - Deneme sorguları başarılı
- Materyalize görünüm: tenant_store_sales_summary (ispopulated=true)
  - Düzenli REFRESH cron’u tanımlı değil

## Fonksiyonlar ve Trigger’lar
- Zamanlanmış prosedürler: cron_generate_monthly_dues, cron_snapshot_monthly_dues_states, cron_dispatch_notifications
- Trigger’lar: students, student_groups, monthly_dues, payments, groups, tenants vb. üzerinde aktif
- Teknik borç: Aynı amaca hizmet eden birden çok sürüm (generate_monthly_dues*, compute_monthly_due*). Argüman tipleri/dönüşler tutarsız (date/text, void/integer). Sadeleştirme önerilir

## Cron İşleri
- 1: 0 3 * * * → SELECT update_overdue_status_pending_only() (son koşu: başarılı)
- 2: 0 1 1 * * → CALL cron_generate_monthly_dues() (son koşu bilgisi yok)
- 3: 0 8 * * * → CALL cron_snapshot_monthly_dues_states() (son koşu: başarılı)
- 4: 0 12 * * * → CALL cron_dispatch_notifications() (son koşu: başarısız)
  - Hata: notification_logs.recipient_contact NOT NULL, öğrencinin phone alanı NULL
  - Etki: Bildirim kuyruğu duruyor; başarısız run detayında INSERT sırasında recipient_contact null

### Önerilen Düzeltme (cron_dispatch_notifications)
```sql
CREATE OR REPLACE PROCEDURE public.cron_dispatch_notifications()
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  month_start date := date_trunc('month', now())::date;
BEGIN
  FOR r IN
    SELECT md.tenant_id, md.student_id, md.snapshot_state, md.due_date, s.phone AS recipient_contact
    FROM public.monthly_dues md
    JOIN public.students s ON s.id = md.student_id
    WHERE s.phone IS NOT NULL
      AND md.snapshot_state IN ('overdue', 'due_today', 'upcoming_1', 'upcoming_2', 'upcoming_3')
      AND md.status <> 'paid'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notification_logs nl
      WHERE nl.tenant_id = r.tenant_id
        AND COALESCE(nl.recipient_contact, '') = COALESCE(r.recipient_contact, '')
        AND date_trunc('month', nl.created_at)::date = month_start
        AND nl.subject = CASE
          WHEN r.snapshot_state = 'overdue' THEN 'Gecikmiş Ödeme'
          WHEN r.snapshot_state = 'due_today' THEN 'Bugün Son Ödeme Günü'
          ELSE 'Ödeme Hatırlatma'
        END
    ) THEN
      INSERT INTO public.notification_logs(
        tenant_id, recipient_type, recipient_id, recipient_contact,
        channel, subject, content, status, created_at
      )
      VALUES(
        r.tenant_id,
        'student',
        r.student_id,
        r.recipient_contact,
        'sms',
        CASE
          WHEN r.snapshot_state = 'overdue' THEN 'Gecikmiş Ödeme'
          WHEN r.snapshot_state = 'due_today' THEN 'Bugün Son Ödeme Günü'
          ELSE 'Ödeme Hatırlatma'
        END,
        'Aidat ödemesi hakkında hatırlatma.',
        'pending',
        now()
      );
    END IF;
  END LOOP;
END;
$$;
```

## RLS Politikaları
- RLS aktif: applications, attendance, groups, monthly_dues, products, students, tenants, trainings vb.
- RLS kapalı ama tenant_id içeriyor:
  - branch_fee_policy_meta
  - notification_templates
  - expenses
  - registration_links
  - tenant_payments
  - audit_logs
  - product_categories
  - notification_logs
  - scheduled_notifications
  - tenant_subscriptions
  - payment_plans
  - announcements
  - website_pages
- Örnek politika:
```sql
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_notification_logs
  ON public.notification_logs
  USING (tenant_id = get_current_user_tenant_id());
```

## updated_at Tutarlılığı
- updated_at sütunu olup tetikleyici olmayan tablolar:
  - announcements
  - branch_fee_policies
  - branch_fee_policy_meta
  - branches
  - instructor_credentials
  - instructors
  - notification_templates
  - orders
  - platform_plans
  - platform_settings
  - products
  - scheduled_notifications
  - student_fee_overrides
  - student_subscriptions
  - tenant_subscriptions
  - trainings
  - users
  - venues
  - website_pages
- Örnek tetikleyici:
```sql
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Materyalize Görünüm Refresh
- Öneri: günlük 23:50’te REFRESH
```sql
SELECT cron.schedule('refresh_tenant_store_sales_summary', '50 23 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.tenant_store_sales_summary$$
);
```

## Güvenlik ve Performans Notları
- RLS’de roles={public} kullanılan politikalar daraltılmalı (örn. {authenticated} veya spesifik roller)
- FK ON DELETE davranışları gözden geçirilmeli (cascade/restrict/no action) ve iş kuralı ile uyumlu hale getirilmeli
- pgsodium/supabase_vault ile hassas alanlar için maskeleme/şifreleme değerlendirilmesi
- pg_stat_statements ile ağır sorguların izlenmesi ve indeks önerilerinin teyidi

## Yapılması Gerekenler
- cron_dispatch_notifications prosedürünü yukarıdaki sürümle güncelle
- Öğrenci phone NULL kayıtlarını dahil etme ve recipient_id yaz
- tenant_store_sales_summary için günlük REFRESH cron’u ekle
- RLS kapalı tenant_id’li tablolarda RLS’yi ENABLE et ve tenant_isolation politikaları ekle
- Bütün FK kolonlarına B-Tree indeks oluştur
- updated_at sütunu olan tablolara güncelleme tetikleyicisi ekle
- generate/compute monthly_dues fonksiyonlarını sadeleştir ve tek sürüme indir
- RLS politikalarındaki roles={public} kapsamını daralt
- FK ON DELETE davranışlarını iş kurallarına göre revize et
- pg_stat_statements ile ağır sorguları incele ve ek indeksleri doğrula


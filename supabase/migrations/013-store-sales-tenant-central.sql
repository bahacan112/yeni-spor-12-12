DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_payments_type create failed: %', SQLERRM;
END $$;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.tenant_store_sales_summary AS
SELECT
  o.tenant_id,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(p.amount), 0) AS total_sales_amount
FROM public.orders o
LEFT JOIN public.payments p
  ON p.order_id = o.id AND p.payment_type = 'product'
GROUP BY o.tenant_id;

CREATE INDEX IF NOT EXISTS idx_tsss_tenant ON public.tenant_store_sales_summary(tenant_id);

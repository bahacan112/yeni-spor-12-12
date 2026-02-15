ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway character varying;

ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway_token character varying;

ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway_conversation_id character varying;

ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway_status character varying;

ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway_error_code character varying;

ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway_error_message character varying;

ALTER TABLE public.tenant_payments
ADD COLUMN IF NOT EXISTS gateway_payload jsonb;

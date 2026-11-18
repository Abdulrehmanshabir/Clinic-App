-- ==============================================================================
-- 006_ADD_CUSTOM_AMOUNT.SQL
-- Procedures no longer carry a fixed catalogue price. The doctor enters the
-- actual fee for each patient procedure on the spot, stored per appointment.
-- NULL means the fee has not been recorded yet ("pending").
-- ==============================================================================

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS custom_amount NUMERIC(10, 2);

CREATE INDEX IF NOT EXISTS idx_appointments_custom_amount ON public.appointments(custom_amount);

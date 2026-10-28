-- ==============================================================================
-- 005_ADD_IS_ONLINE.SQL
-- Adds online-consultation flag to appointments so the front desk can mark
-- a call booking as an ONLINE patient (shows in Doctor -> Online tab/card).
-- ==============================================================================

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appointments_is_online ON public.appointments(is_online);

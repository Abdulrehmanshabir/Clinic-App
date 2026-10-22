-- ==============================================================================
-- 003_RLS_POLICIES.SQL
-- Lumière Skin & Aesthetic Clinic Management System
-- Robust Row Level Security (RLS) policies for Doctor vs Operator Isolation
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'doctor' AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_operator_or_doctor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('doctor', 'operator') AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. Profiles Table RLS
-- ------------------------------------------------------------------------------
-- Users can view their own profile; Doctors can view all profiles
CREATE POLICY "Profiles viewable by user or doctor"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_doctor());

-- Only Doctors can insert or update profiles (operator management)
CREATE POLICY "Doctor manage profiles"
    ON public.profiles FOR ALL
    USING (public.is_doctor())
    WITH CHECK (public.is_doctor());

-- ------------------------------------------------------------------------------
-- 2. Patients Table RLS
-- ------------------------------------------------------------------------------
-- Both Doctor and Operator can view, create, and update patients
CREATE POLICY "Staff can view patients"
    ON public.patients FOR SELECT
    USING (public.is_operator_or_doctor());

CREATE POLICY "Staff can insert patients"
    ON public.patients FOR INSERT
    WITH CHECK (public.is_operator_or_doctor());

CREATE POLICY "Staff can update patients"
    ON public.patients FOR UPDATE
    USING (public.is_operator_or_doctor())
    WITH CHECK (public.is_operator_or_doctor());

-- Only Doctor can delete patients (if ever required)
CREATE POLICY "Doctor can delete patients"
    ON public.patients FOR DELETE
    USING (public.is_doctor());

-- ------------------------------------------------------------------------------
-- 3. Services Table RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Staff can view services"
    ON public.services FOR SELECT
    USING (public.is_operator_or_doctor());

CREATE POLICY "Doctor can manage services"
    ON public.services FOR ALL
    USING (public.is_doctor())
    WITH CHECK (public.is_doctor());

-- ------------------------------------------------------------------------------
-- 4. Clinic Days Table RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Staff can view clinic days"
    ON public.clinic_days FOR SELECT
    USING (public.is_operator_or_doctor());

CREATE POLICY "Doctor can manage clinic days"
    ON public.clinic_days FOR ALL
    USING (public.is_doctor())
    WITH CHECK (public.is_doctor());

-- ------------------------------------------------------------------------------
-- 5. Appointments Table RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Staff can view appointments"
    ON public.appointments FOR SELECT
    USING (public.is_operator_or_doctor());

CREATE POLICY "Staff can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (public.is_operator_or_doctor());

CREATE POLICY "Staff can update appointments"
    ON public.appointments FOR UPDATE
    USING (public.is_operator_or_doctor())
    WITH CHECK (public.is_operator_or_doctor());

-- ------------------------------------------------------------------------------
-- 6. Tokens Table RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Staff can view tokens"
    ON public.tokens FOR SELECT
    USING (public.is_operator_or_doctor());

CREATE POLICY "Staff can create tokens"
    ON public.tokens FOR INSERT
    WITH CHECK (public.is_operator_or_doctor());

-- ------------------------------------------------------------------------------
-- 7. Consultations Table RLS (Confidential Clinical Notes)
-- ------------------------------------------------------------------------------
-- Only Doctor can view and manage consultations
CREATE POLICY "Doctor can view consultations"
    ON public.consultations FOR SELECT
    USING (public.is_doctor());

CREATE POLICY "Doctor can manage consultations"
    ON public.consultations FOR ALL
    USING (public.is_doctor())
    WITH CHECK (public.is_doctor());

-- ------------------------------------------------------------------------------
-- 8. Audit Logs Table RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Doctor can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_doctor());

CREATE POLICY "Staff can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_operator_or_doctor());

-- ------------------------------------------------------------------------------
-- 9. Clinic Settings Table RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Staff can view clinic settings"
    ON public.clinic_settings FOR SELECT
    USING (public.is_operator_or_doctor());

CREATE POLICY "Doctor can manage clinic settings"
    ON public.clinic_settings FOR ALL
    USING (public.is_doctor())
    WITH CHECK (public.is_doctor());

-- ------------------------------------------------------------------------------
-- 10. Enable Supabase Realtime for Queues & Appointments
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_days;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;

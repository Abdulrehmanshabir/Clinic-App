-- ==============================================================================
-- ALL_IN_ONE_SETUP.SQL
-- Lumière Skin & Aesthetic Clinic Management System
-- Complete, Clean & Fully Corrected Single Database Setup File
-- (Tables, Functions, Triggers, RLS Policies, Grants & Seed Data)
-- ==============================================================================

-- 0. Clean & Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('doctor', 'operator')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Patients Sequence & Table
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    age INTEGER,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Clinic Days Table
CREATE TABLE IF NOT EXISTS public.clinic_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_date DATE NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    appointment_type TEXT NOT NULL DEFAULT 'walk_in' CHECK (appointment_type IN ('scheduled', 'walk_in')),
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_consultation', 'completed', 'cancelled', 'no_show')),
    is_online BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Tokens Table (Isolated by clinic date)
CREATE TABLE IF NOT EXISTS public.tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    token_number TEXT NOT NULL,
    token_date DATE NOT NULL,
    queue_position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_token_per_date UNIQUE (token_date, token_number)
);

-- 7. Consultations Table
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    doctor_notes TEXT,
    treatment_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Clinic Settings Table
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_name TEXT NOT NULL DEFAULT 'Lumière Skin & Aesthetic Clinic',
    tagline TEXT DEFAULT 'Advanced Dermatology & Aesthetic Care',
    phone TEXT DEFAULT '+1 (555) 019-2834',
    email TEXT DEFAULT 'contact@lumiereskin.com',
    address TEXT DEFAULT 'Suite 400, Medical Arts Pavilion, Aesthetic Blvd',
    token_prefix TEXT NOT NULL DEFAULT 'T-',
    opening_time TIME DEFAULT '09:00:00',
    closing_time TIME DEFAULT '19:00:00',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON public.patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_is_online ON public.appointments(is_online);
CREATE INDEX IF NOT EXISTS idx_tokens_date ON public.tokens(token_date);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Auto Patient Numbering (P-000001)
CREATE OR REPLACE FUNCTION public.generate_patient_number()
RETURNS TRIGGER AS $$
DECLARE
    next_val BIGINT;
BEGIN
    IF NEW.patient_number IS NULL OR NEW.patient_number = '' THEN
        next_val := nextval('patient_number_seq');
        NEW.patient_number := 'P-' || lpad(next_val::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_patient_number ON public.patients;
CREATE TRIGGER set_patient_number BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.generate_patient_number();

-- Safe Atomic Daily Token Numbering (T-001)
CREATE OR REPLACE FUNCTION public.generate_daily_token(p_appointment_id UUID, p_date DATE)
RETURNS TABLE (
    token_id UUID,
    token_num TEXT,
    queue_pos INT
) AS $$
DECLARE
    next_position INT;
    formatted_token TEXT;
    new_token_id UUID;
    v_prefix TEXT := 'T-';
BEGIN
    SELECT COALESCE(token_prefix, 'T-') INTO v_prefix FROM public.clinic_settings LIMIT 1;
    IF v_prefix IS NULL THEN
        v_prefix := 'T-';
    END IF;

    SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_position
    FROM public.tokens
    WHERE token_date = p_date;

    formatted_token := v_prefix || lpad(next_position::text, 3, '0');

    INSERT INTO public.tokens (appointment_id, token_number, token_date, queue_position)
    VALUES (p_appointment_id, formatted_token, p_date, next_position)
    RETURNING id INTO new_token_id;

    RETURN QUERY SELECT new_token_id, formatted_token, next_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth User Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = COALESCE(EXCLUDED.role, profiles.role),
        is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Base Grants
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- Profiles Policies
DROP POLICY IF EXISTS "allow_authenticated_profiles" ON public.profiles;
CREATE POLICY "allow_authenticated_profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Patients Policies
DROP POLICY IF EXISTS "allow_authenticated_patients" ON public.patients;
CREATE POLICY "allow_authenticated_patients" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Services Policies
DROP POLICY IF EXISTS "allow_authenticated_services" ON public.services;
CREATE POLICY "allow_authenticated_services" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Clinic Days Policies
DROP POLICY IF EXISTS "allow_authenticated_clinic_days" ON public.clinic_days;
CREATE POLICY "allow_authenticated_clinic_days" ON public.clinic_days FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Appointments Policies
DROP POLICY IF EXISTS "allow_authenticated_appointments" ON public.appointments;
CREATE POLICY "allow_authenticated_appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tokens Policies
DROP POLICY IF EXISTS "allow_authenticated_tokens" ON public.tokens;
CREATE POLICY "allow_authenticated_tokens" ON public.tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Consultations Policies
DROP POLICY IF EXISTS "allow_authenticated_consultations" ON public.consultations;
CREATE POLICY "allow_authenticated_consultations" ON public.consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs Policies
DROP POLICY IF EXISTS "allow_authenticated_audit_logs" ON public.audit_logs;
CREATE POLICY "allow_authenticated_audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Clinic Settings Policies
DROP POLICY IF EXISTS "allow_authenticated_clinic_settings" ON public.clinic_settings;
CREATE POLICY "allow_authenticated_clinic_settings" ON public.clinic_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime Publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_days;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Default Clinic Settings
INSERT INTO public.clinic_settings (clinic_name, tagline, phone, email, address, token_prefix, opening_time, closing_time)
VALUES (
    'Lumière Skin & Aesthetic Clinic',
    'Advanced Dermatology & Aesthetic Care',
    '+1 (555) 019-2834',
    'contact@lumiereskin.com',
    'Suite 400, Medical Arts Pavilion, Aesthetic Blvd',
    'T-',
    '09:00:00',
    '19:00:00'
)
ON CONFLICT DO NOTHING;

-- Clinical Services
INSERT INTO public.services (name, description, duration_minutes, price, is_active)
VALUES 
    ('Dermatology Consultation', 'Comprehensive skin, hair and nail evaluation by specialist.', 30, 80.00, true),
    ('Acne & Scar Laser Treatment', 'Targeted Nd:YAG and fractional CO2 laser session.', 45, 150.00, true),
    ('Hydra-Facial Deep Cleanse', 'Multi-step vortex medical grade facial therapy.', 45, 110.00, true),
    ('Chemical Peel (Medical Grade)', 'Glycolic/Salicylic customized skin resurfacing peel.', 30, 95.00, true),
    ('Botox & Dermal Filler Consult', 'Anti-aging aesthetic assessment and precise mapping.', 30, 120.00, true),
    ('Laser Hair Reduction (Face/Body)', 'Diode laser specialized precision treatment.', 40, 130.00, true),
    ('Pigmentation & Melasma Therapy', 'Q-Switched laser and topical depigmentation protocol.', 45, 140.00, true),
    ('Follow-up Review', 'Post-treatment progress assessment and dosage adjustments.', 15, 40.00, true)
ON CONFLICT (name) DO NOTHING;

-- Sync existing auth users to profiles as active
INSERT INTO public.profiles (id, full_name, email, role, is_active)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email), 
    email, 
    COALESCE(raw_user_meta_data->>'role', CASE WHEN email ILIKE '%doctor%' OR email ILIKE '%admin%' THEN 'doctor' ELSE 'operator' END), 
    true
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET is_active = true,
    role = COALESCE(EXCLUDED.role, profiles.role);

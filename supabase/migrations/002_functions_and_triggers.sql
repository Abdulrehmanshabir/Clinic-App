-- ==============================================================================
-- 002_FUNCTIONS_AND_TRIGGERS.SQL
-- Lumière Skin & Aesthetic Clinic Management System
-- Atomic Token Generation, Auto Patient Numbering, Timestamps & Auditing
-- ==============================================================================

-- 1. Helper Function: Auto Updated At Timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_consultations_updated_at ON public.consultations;
CREATE TRIGGER set_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Helper Function: Generate Patient Number (e.g. P-000001)
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

-- 3. Atomic Token Generation Function (Safe against concurrency, resets each day)
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
    -- Read custom prefix from clinic settings if available
    SELECT COALESCE(token_prefix, 'T-') INTO v_prefix FROM public.clinic_settings LIMIT 1;
    IF v_prefix IS NULL THEN
        v_prefix := 'T-';
    END IF;

    -- Lock row/aggregate via transactional count for the target date to guarantee strictly sequential numbers
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

-- 4. Automatically sync auth.users inserts to public.profiles
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
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

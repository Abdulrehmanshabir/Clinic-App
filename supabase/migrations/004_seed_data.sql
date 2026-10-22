-- ==============================================================================
-- 004_SEED_DATA.SQL
-- Lumière Skin & Aesthetic Clinic Management System
-- Seed initial clinic services and clinic settings (optional mock patients/appointments)
-- ==============================================================================

-- 1. Default Clinic Settings
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

-- 2. Initial Clinical Services
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

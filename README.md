# Lumière Skin & Aesthetic Clinic Management System

A production-grade, high-performance, real-time Clinic Patient Queue, Appointment, Token, Doctor Consultation, and Daily Reporting System engineered for physical walk-in and scheduled clinic operations with zero patient logins.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: Next.js 14+ (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript with strict typing
- **Database & Auth**: Supabase (PostgreSQL 15+, Row-Level Security, Supabase Auth, Supabase Realtime)
- **Styling**: Tailwind CSS & Lucide React
- **Form Management & Validation**: React Hook Form, Zod

---

## 🏥 Clinical Workflow

```
Patient Physically Arrives
          ↓
Front Desk Operator Opens Desk
          ↓
Search Existing Patient (by ID / Phone / Name) OR Register New Patient
          ↓
Select Service & Schedule Appointment / Issue Token
          ↓
Appointment & Atomic Daily Token Generated (e.g. T-001)
          ↓
Token Appears Instantly on Doctor Dashboard via Supabase Realtime (Status: WAITING)
          ↓
Doctor Calls / Starts Consultation (Status: IN_CONSULTATION)
          ↓
Doctor Enters Clinical Assessment, Laser / Rx Notes & Completes Visit (Status: COMPLETED)
          ↓
Realtime Queue, Live KPIs & Longitudinal Medical History Synchronized
```

---

## 🔒 Security & Role-Based Access Control (RLS)

The system enforces strict multi-tenant and role-based policies:

1. **Doctor (Administrator)**:
   - Full oversight across daily clinic records, queue operations, medical consultation notes, and patient history.
   - Access to financial KPIs, date-wise reports, clinical service catalogues, operator accounts, and clinic closing controls.

2. **Operator (Front Desk Reception)**:
   - Limited strictly to patient registration, fast directory search, appointment creation, queue tokens, and reception queue tracking.
   - Denied access to confidential doctor clinical notes, revenue analytics, operator management, and clinic configuration.

3. **Patients**:
   - Zero login / credentials needed. Medical records are managed on-site by clinic staff.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Tested on Node 22)
- A Supabase Project (PostgreSQL database)

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Apply Database Migrations
Execute the SQL migration scripts in order in your Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql` (Tables, Constraints, Indexes)
2. `supabase/migrations/002_functions_and_triggers.sql` (Atomic daily token generator, patient numbering `P-000001`, user sync)
3. `supabase/migrations/003_rls_policies.sql` (Row-Level Security and Realtime publication)
4. `supabase/migrations/004_seed_data.sql` (Initial clinical aesthetic services & clinic configuration)
5. `supabase/migrations/005_add_is_online.sql` (Online patient flag for call bookings)

### 4. Install Dependencies & Build
```bash
npm install
npm run build
npm run start
```

For development:
```bash
npm run dev
```

---

## 🧪 Testing Realtime Synchronization

1. **Browser Window A (Operator)**: Log in with an operator account (`/login` -> `/operator`).
2. **Browser Window B (Doctor)**: Log in with a doctor account (`/login` -> `/doctor`).
3. Create a patient and generate a token in Browser A.
4. Verify that the token appears on Browser B's dashboard in **realtime without manual browser refresh**.
5. Click **Start Consultation** on Browser B.
6. Observe status automatically update to `IN_CONSULTATION` on Browser A.
7. Fill in medical notes and click **Complete Patient** in Browser B.
8. Verify both screens reflect `COMPLETED` and KPI counters update immediately.

---

## 📁 Key Directories & Structure

```
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── doctor/         # Doctor live consultation console
│   │   │   ├── operator/       # Front desk patient & token desk
│   │   │   ├── patients/       # Patient directory & medical history
│   │   │   ├── appointments/   # Appointment scheduling & token register
│   │   │   ├── queue/          # Live waiting room display
│   │   │   ├── history/        # Date-wise records & daily closing
│   │   │   ├── reports/        # KPIs & procedure analytics
│   │   │   ├── services/       # Clinical procedure management
│   │   │   ├── operators/      # Staff user provisioning
│   │   │   └── settings/       # Clinic configuration
│   │   ├── login/              # Staff authentication
│   │   └── layout.tsx          # Root layout & Toast provider
│   ├── components/             # Reusable UI, modals, forms & charts
│   ├── hooks/                  # Realtime Supabase hooks
│   ├── lib/                    # Supabase clients, actions, queries & validations
│   └── types/                  # TypeScript database & entity interfaces
└── supabase/
    └── migrations/             # Reproducible PostgreSQL migrations
```

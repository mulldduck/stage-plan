-- STAGE PLAN Database Schema & RLS Policies v2.0
-- Target: PostgreSQL 15+ / Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are manageable by owner only"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- 2. Staff
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code TEXT,
  display_name TEXT NOT NULL,
  team TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, employee_code)
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manageable by owner only"
  ON public.staff FOR ALL
  USING (auth.uid() = owner_id);

-- 3. Staff Aliases
CREATE TABLE IF NOT EXISTS public.staff_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  UNIQUE(owner_id, alias)
);

ALTER TABLE public.staff_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff aliases manageable by owner only"
  ON public.staff_aliases FOR ALL
  USING (auth.uid() = owner_id);

-- 4. Venues
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  aliases JSONB DEFAULT '[]'::jsonb,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues manageable by owner only"
  ON public.venues FOR ALL
  USING (auth.uid() = owner_id);

-- 5. Events
CREATE TYPE event_time_status AS ENUM ('unknown', 'known');
CREATE TYPE event_prog_status AS ENUM ('draft', 'confirmed', 'cancelled');
CREATE TYPE event_source_kind AS ENUM ('manual', 'note');

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  venue_name TEXT,
  occurs_on DATE NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  time_status event_time_status NOT NULL DEFAULT 'unknown',
  prep_minutes INT NOT NULL DEFAULT 0,
  wrap_minutes INT NOT NULL DEFAULT 0,
  status event_prog_status NOT NULL DEFAULT 'confirmed',
  color TEXT NOT NULL DEFAULT '#4169FF',
  source_kind event_source_kind NOT NULL DEFAULT 'manual',
  source_ref TEXT,
  organizer_hint TEXT,
  note_text TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_event_time CHECK (
    time_status = 'unknown' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)
  )
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events manageable by owner only"
  ON public.events FOR ALL
  USING (auth.uid() = owner_id);

-- 6. Assignments
CREATE TYPE assignment_status_enum AS ENUM ('tentative', 'confirmed', 'cancelled');
CREATE TYPE assignment_source_enum AS ENUM ('manual', 'note', 'auto');

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  role_name TEXT DEFAULT '진행',
  status assignment_status_enum NOT NULL DEFAULT 'confirmed',
  source assignment_source_enum NOT NULL DEFAULT 'manual',
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  occupied_start TIMESTAMPTZ,
  occupied_end TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, event_id, staff_id)
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments manageable by owner only"
  ON public.assignments FOR ALL
  USING (auth.uid() = owner_id);

-- Exclusion constraint to prevent overlapping confirmed assignments for same staff
ALTER TABLE public.assignments
  ADD CONSTRAINT exclude_overlapping_assignments
  EXCLUDE USING gist (
    owner_id WITH =,
    staff_id WITH =,
    tstzrange(occupied_start, occupied_end, '[)') WITH &&
  )
  WHERE (status = 'confirmed' AND occupied_start IS NOT NULL AND occupied_end IS NOT NULL);

-- 7. Availability Blocks
CREATE TYPE availability_block_enum AS ENUM (
  'all_day_unavailability',
  'event_exclusion',
  'external_commitment',
  'available_override'
);

CREATE TABLE IF NOT EXISTS public.staff_availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  block_type availability_block_enum NOT NULL,
  on_date DATE NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  description TEXT,
  verification_status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.staff_availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Availability blocks manageable by owner only"
  ON public.staff_availability_blocks FOR ALL
  USING (auth.uid() = owner_id);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs viewable by owner only"
  ON public.audit_logs FOR ALL
  USING (auth.uid() = owner_id);

-- =============================================================================
-- Migration 0007 — IIT Academic Intelligence schema
-- =============================================================================
-- Tables:
--   iit_courses, iit_assignments, iit_lectures, academic_documents
--
-- Course tracker with credits/marks, assignment tracker, lecture progress, and
-- an academic document vault (ID card, hall tickets, certificates, notes).
-- All user-owned. RLS is defined in 0009. Document files live in the
-- `iit-documents` storage bucket (created in 0010).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'course_status') then
    create type public.course_status as enum (
      'planned',
      'in_progress',
      'completed',
      'dropped'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type public.assignment_status as enum (
      'pending',
      'in_progress',
      'submitted',
      'graded',
      'late',
      'missed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lecture_status') then
    create type public.lecture_status as enum (
      'not_started',
      'in_progress',
      'completed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'document_type') then
    create type public.document_type as enum (
      'id_card',
      'hall_ticket',
      'certificate',
      'event_registration',
      'lecture_notes',
      'transcript',
      'other'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- iit_courses
-- -----------------------------------------------------------------------------
create table if not exists public.iit_courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  code        text,
  name        text not null,
  credits     numeric(4, 1),
  semester    text,
  status      public.course_status not null default 'in_progress',
  instructor  text,
  grade       text,
  marks       numeric(6, 2),
  max_marks   numeric(6, 2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists iit_courses_user_id_idx
  on public.iit_courses (user_id);

-- -----------------------------------------------------------------------------
-- iit_assignments
-- -----------------------------------------------------------------------------
create table if not exists public.iit_assignments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  course_id     uuid references public.iit_courses (id) on delete cascade,
  title         text not null,
  description   text,
  due_date      timestamptz,
  status        public.assignment_status not null default 'pending',
  score         numeric(6, 2),
  max_score     numeric(6, 2),
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists iit_assignments_user_id_idx
  on public.iit_assignments (user_id);
create index if not exists iit_assignments_course_id_idx
  on public.iit_assignments (course_id);
create index if not exists iit_assignments_due_date_idx
  on public.iit_assignments (due_date);

-- -----------------------------------------------------------------------------
-- iit_lectures
-- -----------------------------------------------------------------------------
create table if not exists public.iit_lectures (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  course_id         uuid references public.iit_courses (id) on delete cascade,
  title             text not null,
  lecture_number    integer,
  status            public.lecture_status not null default 'not_started',
  duration_minutes  integer,
  video_url         text,
  notes             text,
  watched_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists iit_lectures_user_id_idx
  on public.iit_lectures (user_id);
create index if not exists iit_lectures_course_id_idx
  on public.iit_lectures (course_id);

-- -----------------------------------------------------------------------------
-- academic_documents (vault: ID card, hall tickets, certificates, notes)
-- -----------------------------------------------------------------------------
create table if not exists public.academic_documents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  type             public.document_type not null default 'other',
  title            text not null,
  description      text,
  storage_bucket   text,
  storage_path     text,
  file_url         text,
  file_size_bytes  bigint,
  mime_type        text,
  course_id        uuid references public.iit_courses (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists academic_documents_user_id_idx
  on public.academic_documents (user_id);
create index if not exists academic_documents_type_idx
  on public.academic_documents (type);
create index if not exists academic_documents_course_id_idx
  on public.academic_documents (course_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'iit_courses', 'iit_assignments', 'iit_lectures', 'academic_documents'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

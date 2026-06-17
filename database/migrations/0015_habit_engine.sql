-- =============================================================================
-- Migration 0015 — Habit Engine + Notification System
-- =============================================================================
-- SanOS Recovery Phase 1. Adds the layer that turns the app from a passive
-- tracker into one that remembers on the user's behalf:
--   * reminders          — user-defined one-time/recurring reminders
--   * notifications      — persistent notification log (unread/read/snoozed/
--                           completed/expired), sourced from reminders OR the
--                           existing revision_queue / iit_assignments tables
--                           (polymorphic source_type/source_id, same shape as
--                           events.entity_type/entity_id)
--   * user_preferences   — one row per user: focus mode, notification/brief
--                           toggles, quiet hours, hidden categories
--
-- Streaks remain derived from daily_logs (no new columns). revision_queue and
-- iit_assignments are NOT migrated — the Habit Engine aggregates across all
-- three sources rather than becoming a second source of truth.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'reminder_category') then
    create type public.reminder_category as enum (
      'learning_dsa',
      'learning_revision',
      'learning_concepts',
      'learning_roadmaps',
      'academic_iit',
      'academic_assignments',
      'academic_exams',
      'project_development',
      'project_client_work',
      'personal_priorities',
      'personal_relationships',
      'personal_family',
      'health_sleep',
      'health_exercise'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'reminder_recurrence') then
    create type public.reminder_recurrence as enum (
      'one_time',
      'daily',
      'weekly',
      'monthly',
      'custom'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type public.reminder_status as enum (
      'active',
      'paused',
      'completed',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_state') then
    create type public.notification_state as enum (
      'unread',
      'read',
      'snoozed',
      'completed',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_source_type') then
    create type public.notification_source_type as enum (
      'reminder',
      'revision',
      'iit_assignment',
      'system'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'focus_mode') then
    create type public.focus_mode as enum (
      'work',
      'academic',
      'personal',
      'family',
      'recovery',
      'deep_focus',
      'none'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- reminders
-- -----------------------------------------------------------------------------
create table if not exists public.reminders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  title              text not null,
  description        text,
  category           public.reminder_category not null,
  recurrence         public.reminder_recurrence not null default 'one_time',
  interval_days      integer check (interval_days is null or interval_days > 0),
  interval_weeks     integer check (interval_weeks is null or interval_weeks > 0),
  interval_months    integer check (interval_months is null or interval_months > 0),
  time_of_day        time,
  scheduled_at       timestamptz,
  next_occurrence_at timestamptz,
  status             public.reminder_status not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists reminders_user_id_idx on public.reminders (user_id);
create index if not exists reminders_next_occurrence_idx
  on public.reminders (user_id, next_occurrence_at) where status = 'active';
create index if not exists reminders_category_idx on public.reminders (user_id, category);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  state         public.notification_state not null default 'unread',
  source_type   public.notification_source_type not null,
  source_id     uuid,
  title         text not null,
  body          text,
  category      public.reminder_category,
  due_at        timestamptz,
  snoozed_until timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_state_idx on public.notifications (user_id, state);
create index if not exists notifications_source_idx
  on public.notifications (source_type, source_id);

-- Idempotency guard: re-evaluating due items on every dashboard load must not
-- duplicate a notification for the same source row while it's still active.
create unique index if not exists notifications_source_once_idx
  on public.notifications (user_id, source_type, source_id)
  where source_id is not null and state in ('unread', 'read', 'snoozed');

-- -----------------------------------------------------------------------------
-- user_preferences — one row per user (settings, not session state)
-- -----------------------------------------------------------------------------
create table if not exists public.user_preferences (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  default_focus_mode     public.focus_mode not null default 'none',
  notifications_enabled  boolean not null default true,
  daily_brief_enabled    boolean not null default true,
  evening_review_enabled boolean not null default true,
  quiet_hours_start      time,
  quiet_hours_end        time,
  hidden_categories      public.reminder_category[] not null default '{}',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint user_preferences_user_id_unique unique (user_id)
);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array['reminders', 'notifications', 'user_preferences'];
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

-- -----------------------------------------------------------------------------
-- RLS — owner-only on all three tables
-- -----------------------------------------------------------------------------
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "reminders_owner" on public.reminders;
create policy "reminders_owner" on public.reminders
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_preferences_owner" on public.user_preferences;
create policy "user_preferences_owner" on public.user_preferences
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

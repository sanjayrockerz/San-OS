-- =============================================================================
-- Migration 0001 — Extensions, enum types, and shared helpers
-- =============================================================================
-- Idempotent foundation that every later migration depends on.
-- =============================================================================

-- gen_random_uuid() and crypto helpers.
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'difficulty_level') then
    create type public.difficulty_level as enum ('easy', 'medium', 'hard');
  end if;

  if not exists (select 1 from pg_type where typname = 'problem_platform') then
    create type public.problem_platform as enum (
      'leetcode',
      'codeforces',
      'hackerrank',
      'codechef',
      'geeksforgeeks',
      'atcoder',
      'interviewbit',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'solve_status') then
    create type public.solve_status as enum (
      'solved',
      'solved_with_help',
      'partial',
      'unsolved',
      'gave_up'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'revision_state') then
    create type public.revision_state as enum (
      'new',
      'learning',
      'reviewing',
      'mastered',
      'struggling'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- updated_at trigger function
-- -----------------------------------------------------------------------------
-- Sets NEW.updated_at to now() on every UPDATE. Attached to every table that
-- carries an updated_at column.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

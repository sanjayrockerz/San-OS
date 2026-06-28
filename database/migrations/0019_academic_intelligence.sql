-- Phase 6A: Academic Performance Intelligence
-- Adds structured semester tracking, academic goals, and enriches iit_courses
-- with grade point, attempts, and attendance for the CGPA Engine.

-- ─── Semester status enum ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE semester_status AS ENUM ('upcoming', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Academic semesters ───────────────────────────────────────────────────────
-- One row per semester. semester_number drives ordering (1 = first semester ever).
-- sgpa and cgpa_after can be overridden by the student when entering historical
-- data so the engine can work with external transcripts as ground truth.
CREATE TABLE IF NOT EXISTS academic_semesters (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_number  integer NOT NULL,         -- 1, 2, 3 … for sort order
  name             text NOT NULL,            -- "Semester 1", "Semester 3 (2023-24)"
  academic_year    text,                     -- "2022-23"
  total_credits    numeric(6,1) DEFAULT 0,
  earned_credits   numeric(6,1) DEFAULT 0,
  sgpa             numeric(4,2),             -- semester GPA (stored or computed)
  cgpa_after       numeric(4,2),             -- cumulative GPA after this semester
  backlogs         integer DEFAULT 0,
  status           semester_status NOT NULL DEFAULT 'upcoming',
  is_current       boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, semester_number)
);

CREATE INDEX IF NOT EXISTS academic_semesters_user_id_idx
  ON academic_semesters(user_id);
CREATE INDEX IF NOT EXISTS academic_semesters_user_number_idx
  ON academic_semesters(user_id, semester_number);

CREATE OR REPLACE TRIGGER set_academic_semesters_updated_at
  BEFORE UPDATE ON academic_semesters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE academic_semesters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own academic_semesters" ON academic_semesters;
CREATE POLICY "Users manage own academic_semesters"
  ON academic_semesters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Academic goals ───────────────────────────────────────────────────────────
-- One row per user (upsert on conflict). Stores aspirations used by the
-- Target Planner and Placement Readiness panels.
CREATE TABLE IF NOT EXISTS academic_goals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_cgpa      numeric(4,2),
  dream_company    text,
  total_semesters  integer DEFAULT 8,        -- total semesters in the programme
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS academic_goals_user_id_idx
  ON academic_goals(user_id);

CREATE OR REPLACE TRIGGER set_academic_goals_updated_at
  BEFORE UPDATE ON academic_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE academic_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own academic_goals" ON academic_goals;
CREATE POLICY "Users manage own academic_goals"
  ON academic_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Extend iit_courses ───────────────────────────────────────────────────────
ALTER TABLE iit_courses
  ADD COLUMN IF NOT EXISTS semester_id          uuid REFERENCES academic_semesters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grade_point          numeric(3,1),     -- 0.0–10.0 explicit override
  ADD COLUMN IF NOT EXISTS attempts             integer DEFAULT 1, -- number of attempts (1 = first sit)
  ADD COLUMN IF NOT EXISTS attendance_percentage numeric(5,2);    -- 0.00–100.00

CREATE INDEX IF NOT EXISTS iit_courses_semester_id_idx
  ON iit_courses(semester_id);

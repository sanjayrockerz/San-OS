-- =============================================================================
-- 0014 — User Context Engine
-- =============================================================================
-- One row per user. Upserted (not inserted) on every significant action so the
-- app can surface "what you were doing" and "what to do next" on re-entry.
-- The pending_action + resume_payload carry lightweight hints for the UI;
-- no heavy analytics live here — those stay in events / daily_logs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_context (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Last active entity (the thing the user was working on)
  active_entity_type  TEXT,          -- 'problem' | 'concept' | 'vault' | 'revision' | 'iit_assignment'
  active_entity_id    TEXT,          -- UUID of that entity
  active_session_type TEXT,          -- 'solving' | 'revising' | 'writing' | 'uploading'

  -- Recency
  last_activity_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Learning focus (derived from recent problem topics)
  current_focus_topic TEXT,

  -- Deferred nudge (the app should ask about this next time)
  pending_action      TEXT,          -- e.g. 'add_reflection' | 'link_vault' | 'write_concept'
  resume_payload      JSONB       NOT NULL DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_context_user_id_unique UNIQUE (user_id)
);

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_user_context'
  ) THEN
    CREATE TRIGGER set_updated_at_user_context
      BEFORE UPDATE ON user_context
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_context_owner" ON user_context;
CREATE POLICY "user_context_owner" ON user_context
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

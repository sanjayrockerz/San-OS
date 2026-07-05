-- =============================================================================
-- Migration 0023 — Semantic Memory (Vector Search)
-- =============================================================================

-- Enable pgvector
create extension if not exists vector;

-- 1. Add vector column to capture_items (Universal Capture)
alter table public.capture_items add column if not exists embedding vector(384);
create index if not exists capture_items_embedding_idx on public.capture_items using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 2. Add vector column to concept_notes (Knowledge Vault)
alter table public.concept_notes add column if not exists embedding vector(384);
create index if not exists concept_notes_embedding_idx on public.concept_notes using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 3. Add vector column to events (Memory Timeline)
alter table public.events add column if not exists embedding vector(384);
create index if not exists events_embedding_idx on public.events using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4. Semantic Search RPC function
create or replace function match_semantic_items (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  source text,
  content text,
  similarity float
)
language sql stable
as $$
  (
    select 
      id, 
      'capture' as source, 
      content, 
      1 - (embedding <=> query_embedding) as similarity
    from capture_items
    where user_id = p_user_id
      and embedding is not null
      and 1 - (embedding <=> query_embedding) > match_threshold
    order by embedding <=> query_embedding
    limit match_count
  )
  union all
  (
    select 
      id, 
      'knowledge' as source, 
      title || ' - ' || coalesce(personal_explanation, '') as content, 
      1 - (embedding <=> query_embedding) as similarity
    from concept_notes
    where user_id = p_user_id
      and embedding is not null
      and 1 - (embedding <=> query_embedding) > match_threshold
    order by embedding <=> query_embedding
    limit match_count
  )
  union all
  (
    select 
      id, 
      'event' as source, 
      event_type || ' ' || (payload->>'description') as content, 
      1 - (embedding <=> query_embedding) as similarity
    from events
    where user_id = p_user_id
      and embedding is not null
      and 1 - (embedding <=> query_embedding) > match_threshold
    order by embedding <=> query_embedding
    limit match_count
  )
  order by similarity desc
  limit match_count;
$$;

-- =============================================================================
-- Reference copy — set_updated_at()
-- =============================================================================
-- This function is created by migration 0001 (the source of truth). It is kept
-- here so the `database/functions/` folder documents reusable DB functions in
-- one place. Do not run this directly out of order; apply migrations instead.
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

import type { Repositories } from "@/lib/repositories";

/**
 * Base class for domain services.
 *
 * Services orchestrate business rules and compose one or more repositories.
 * They never touch the database directly — that is the repositories' job. A
 * service is constructed with the full {@link Repositories} bundle (all bound to
 * the same Supabase client) so cross-domain workflows (e.g. recording a solve
 * also schedules revision and logs activity) stay in one place.
 */
export abstract class BaseService {
  protected constructor(protected readonly repos: Repositories) {}
}

/** ISO date (YYYY-MM-DD) in UTC — the key used by daily_logs / brief_date. */
export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

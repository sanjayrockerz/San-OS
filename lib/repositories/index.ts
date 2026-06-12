/**
 * Repository layer barrel.
 *
 * Repositories own ALL direct database access (per the architecture rules) and
 * contain no business logic. Concrete, domain-specific repositories are added
 * in later phases; this phase ships only the generic infrastructure base.
 */
export * from "./base.repository";

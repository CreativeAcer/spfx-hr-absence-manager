// ============================================================
// utils/dateUtils.ts
// Shared date-formatting and calculation helpers.
// Single source of truth — import here instead of duplicating.
// ============================================================

export const NL_LOCALE = 'nl-BE' as const;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatDatum(datum: Date): string {
  return datum.toLocaleDateString(NL_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTijdstip(datum: Date): string {
  return datum.toLocaleString(NL_LOCALE, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Returns the ceiling of (tot - van) in whole days. Negative when van > tot. */
export function berekenDagenVerschil(van: Date, tot: Date): number {
  return Math.ceil((tot.getTime() - van.getTime()) / MS_PER_DAY);
}

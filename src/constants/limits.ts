// ============================================================
// constants/limits.ts
// SharePoint query limits and UI threshold constants.
// Change here — effect is immediate everywhere.
// ============================================================

/** Maximum items fetched per SharePoint list request (one page for getAll). */
export const SP_QUERY_LIMITS = {
  AFWEZIGHEDEN: 500,
  DOCUMENTEN:   100,
  AUDIT_LOG:     50,
  SETTINGS:      50,
} as const;

/** Day-count thresholds used for visual urgency indicators. */
export const DREMPEL_DAGEN = {
  /** Red / critical — less than or equal to this many days remaining. */
  KRITIEK:      3,
  /** Yellow / warning — less than or equal to this many days remaining. */
  WAARSCHUWING: 7,
} as const;

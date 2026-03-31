// ============================================================
// constants/auditConfig.ts
// Visual configuration for audit action types.
// Previously inline in AuditLogInhoud.tsx.
// ============================================================
import { AuditActie } from '../models';

export const ACTIE_CONFIG: Record<AuditActie, { kleur: string; icoon: string }> = {
  'Aangemaakt':   { kleur: '#0078d4', icoon: 'Add' },
  'Verlengd':     { kleur: '#ca5010', icoon: 'CalendarSettings' },
  'Terug actief': { kleur: '#107c10', icoon: 'CheckMark' },
  'Bewerkt':      { kleur: '#5c2d91', icoon: 'Edit' },
  'Gearchiveerd': { kleur: '#605e5c', icoon: 'Archive' },
};

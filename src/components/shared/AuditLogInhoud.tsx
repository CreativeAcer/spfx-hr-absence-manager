// ============================================================
// components/shared/AuditLogInhoud.tsx
// Herbruikbare audit-log inhoud — zonder Panel-wrapper.
// Wordt gebruikt door AuditLogPanel én inline in modals.
// ============================================================
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Stack, Text, Spinner, SpinnerSize, Icon, Separator } from '@fluentui/react';
import { IAuditEntry, AuditActie } from '../../models';
import { auditService } from '../../services/AuditService';
import styles from './AuditLogPanel.module.scss';

const ACTIE_CONFIG: Record<AuditActie, { kleur: string; icoon: string }> = {
  'Aangemaakt':   { kleur: '#0078d4', icoon: 'Add' },
  'Verlengd':     { kleur: '#ca5010', icoon: 'CalendarSettings' },
  'Terug actief': { kleur: '#107c10', icoon: 'CheckMark' },
  'Bewerkt':      { kleur: '#5c2d91', icoon: 'Edit' },
  'Gearchiveerd': { kleur: '#605e5c', icoon: 'Archive' },
};

function formatTijdstip(datum: Date): string {
  return datum.toLocaleString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const AuditEntryItem: React.FC<{ entry: IAuditEntry }> = ({ entry }) => {
  const config = ACTIE_CONFIG[entry.actie] ?? ACTIE_CONFIG.Bewerkt;
  const [isExpanded, setIsExpanded] = useState(false);

  let oudeWaardeObj: Record<string, unknown> | undefined;
  let nieuweWaardeObj: Record<string, unknown> | undefined;
  try { if (entry.oudeWaarde) oudeWaardeObj = JSON.parse(entry.oudeWaarde) as Record<string, unknown>; } catch { /* ignore */ }
  try { if (entry.nieuweWaarde) nieuweWaardeObj = JSON.parse(entry.nieuweWaarde) as Record<string, unknown>; } catch { /* ignore */ }

  return (
    <Stack className={styles.entryContainer} tokens={{ childrenGap: 6 }}>
      <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
        <div className={styles.actieDot} style={{ backgroundColor: config.kleur }}>
          <Icon iconName={config.icoon} styles={{ root: { color: 'white', fontSize: 10 } }} />
        </div>
        <Stack grow tokens={{ childrenGap: 2 }}>
          <Text variant="smallPlus" styles={{ root: { fontWeight: 600, color: config.kleur } }}>{entry.actie}</Text>
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
            {entry.gewijzigdDoor.displayName} &mdash; {formatTijdstip(entry.tijdstip)}
          </Text>
        </Stack>
      </Stack>

      {entry.opmerking && (
        <Text variant="small" styles={{ root: { paddingLeft: 34, fontStyle: 'italic' } }}>
          &ldquo;{entry.opmerking}&rdquo;
        </Text>
      )}

      {(oudeWaardeObj ?? nieuweWaardeObj) && (
        <Stack styles={{ root: { paddingLeft: 34 } }}>
          <Text
            variant="small"
            styles={{ root: { color: '#0078d4', cursor: 'pointer', textDecoration: 'underline' } }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▲ Verberg details' : '▼ Toon gewijzigde velden'}
          </Text>
          {isExpanded && (
            <Stack tokens={{ childrenGap: 4 }} className={styles.detailsContainer}>
              {oudeWaardeObj && (
                <Stack tokens={{ childrenGap: 2 }}>
                  <Text variant="tiny" styles={{ root: { color: '#a4262c', fontWeight: 600 } }}>VOOR:</Text>
                  <pre className={styles.jsonPre}>{JSON.stringify(oudeWaardeObj, null, 2)}</pre>
                </Stack>
              )}
              {nieuweWaardeObj && (
                <Stack tokens={{ childrenGap: 2 }}>
                  <Text variant="tiny" styles={{ root: { color: '#107c10', fontWeight: 600 } }}>NA:</Text>
                  <pre className={styles.jsonPre}>{JSON.stringify(nieuweWaardeObj, null, 2)}</pre>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
};

interface IAuditLogInhoudProps {
  afwezigheidId: number;
  /** Lazy: enkel laden wanneer true. Standaard altijd laden. */
  laden?: boolean;
}

export const AuditLogInhoud: React.FC<IAuditLogInhoudProps> = ({ afwezigheidId, laden = true }) => {
  const [entries, setEntries] = useState<IAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fout, setFout] = useState<string | undefined>(undefined);
  const [heeftGeladen, setHeeftGeladen] = useState(false);

  useEffect(() => {
    if (!laden || heeftGeladen) return;
    setIsLoading(true);
    setFout(undefined);
    auditService
      .getAuditLogVoorAfwezigheid(afwezigheidId)
      .then((data) => { setEntries(data); setHeeftGeladen(true); })
      .catch(() => setFout('Kon de historiek niet laden.'))
      .finally(() => setIsLoading(false));
  }, [afwezigheidId, laden, heeftGeladen]);

  if (isLoading) {
    return <Stack horizontalAlign="center" styles={{ root: { padding: '12px 0' } }}><Spinner size={SpinnerSize.small} label="Historiek laden..." /></Stack>;
  }
  if (fout) {
    return <Text styles={{ root: { color: '#a4262c', fontSize: 12 } }}>{fout}</Text>;
  }
  if (entries.length === 0) {
    return (
      <Stack horizontalAlign="center" tokens={{ childrenGap: 6 }} styles={{ root: { padding: '8px 0' } }}>
        <Icon iconName="History" styles={{ root: { fontSize: 24, color: '#c8c6c4' } }} />
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>Nog geen wijzigingen geregistreerd</Text>
      </Stack>
    );
  }
  return (
    <>
      <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
        {entries.length} wijziging{entries.length === 1 ? '' : 'en'}
      </Text>
      <Separator />
      <Stack tokens={{ childrenGap: 10 }}>
        {entries.map((entry) => <AuditEntryItem key={entry.id} entry={entry} />)}
      </Stack>
    </>
  );
};

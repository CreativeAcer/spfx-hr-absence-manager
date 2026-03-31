// ============================================================
// components/shared/AuditEntryItem.tsx
// Presentational component for a single audit log entry.
// Extracted from AuditLogInhoud so it can be found by name.
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import { Stack, Text, Icon } from '@fluentui/react';
import { IAuditEntry } from '../../models';
import { ACTIE_CONFIG } from '../../constants';
import { formatTijdstip } from '../../utils/dateUtils';
import styles from './AuditLogPanel.module.scss';

interface IAuditEntryItemProps {
  entry: IAuditEntry;
}

export const AuditEntryItem: React.FC<IAuditEntryItemProps> = ({ entry }) => {
  const config = ACTIE_CONFIG[entry.actie] ?? ACTIE_CONFIG['Bewerkt'];
  const [isExpanded, setIsExpanded] = useState(false);

  let oudeWaardeObj: Record<string, unknown> | undefined;
  let nieuweWaardeObj: Record<string, unknown> | undefined;
  try { if (entry.oudeWaarde) oudeWaardeObj = JSON.parse(entry.oudeWaarde) as Record<string, unknown>; } catch { /* ignore */ }
  try { if (entry.nieuweWaarde) nieuweWaardeObj = JSON.parse(entry.nieuweWaarde) as Record<string, unknown>; } catch { /* ignore */ }

  const heeftDetails = !!(oudeWaardeObj ?? nieuweWaardeObj);

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

      {heeftDetails && (
        <Stack styles={{ root: { paddingLeft: 34 } }}>
          <Text
            variant="small"
            role="button"
            tabIndex={0}
            styles={{ root: { color: '#0078d4', cursor: 'pointer', textDecoration: 'underline' } }}
            onClick={() => setIsExpanded(!isExpanded)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); }
            }}
            aria-expanded={isExpanded}
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

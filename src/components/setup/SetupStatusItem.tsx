// ============================================================
// components/setup/SetupStatusItem.tsx
// Presentational item for a single SharePoint structure check.
// Extracted from SetupPanel to keep that file manageable.
// ============================================================
import * as React from 'react';
import { Stack, Text, ActionButton, Spinner, SpinnerSize, Icon, TooltipHost } from '@fluentui/react';
import { ISetupItem, SetupItemStatus } from '../../services/SetupService';
import styles from './SetupPanel.module.scss';

interface IStatusVisueel { icoon: string; kleur: string; label: string; }

function getStatusVisueel(status: SetupItemStatus): IStatusVisueel {
  switch (status) {
    case 'bestaat':   return { icoon: 'CheckMark',     kleur: '#107c10', label: 'Bestaat al'  };
    case 'ontbreekt': return { icoon: 'Warning',        kleur: '#ca5010', label: 'Ontbreekt'   };
    case 'bezig':     return { icoon: 'Sync',           kleur: '#0078d4', label: 'Bezig...'    };
    case 'klaar':     return { icoon: 'CheckMark',      kleur: '#107c10', label: 'Aangemaakt'  };
    case 'fout':      return { icoon: 'ErrorBadge',     kleur: '#a4262c', label: 'Fout'        };
    default:          return { icoon: 'CircleHalfFull', kleur: '#605e5c', label: 'Onbekend'    };
  }
}

function getStatusKlasse(status: SetupItemStatus): string {
  const map: Partial<Record<SetupItemStatus, string>> = {
    bestaat:   styles.status_bestaat,
    ontbreekt: styles.status_ontbreekt,
    bezig:     styles.status_bezig,
    klaar:     styles.status_klaar,
    fout:      styles.status_fout,
  };
  return map[status] ?? '';
}

interface ISetupStatusItemProps {
  item: ISetupItem;
  onEnkelAanmaken: (id: string) => void;
  isGlobaalBezig: boolean;
}

export const SetupStatusItem: React.FC<ISetupStatusItemProps> = ({ item, onEnkelAanmaken, isGlobaalBezig }) => {
  const visueel = getStatusVisueel(item.status);
  const isBezig  = item.status === 'bezig';
  const kanAanmaken = item.status === 'ontbreekt' || item.status === 'fout';

  return (
    <Stack className={`${styles.statusItem} ${getStatusKlasse(item.status)}`} tokens={{ childrenGap: 6 }}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
        <Stack className={styles.statusIcoonWrapper}>
          {isBezig
            ? <Spinner size={SpinnerSize.small} />
            : <Icon iconName={visueel.icoon} styles={{ root: { color: visueel.kleur, fontSize: 18 } }} />
          }
        </Stack>
        <Stack grow tokens={{ childrenGap: 2 }}>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Text className={styles.itemLabel}>{item.label}</Text>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: visueel.kleur + '20', color: visueel.kleur, border: `1px solid ${visueel.kleur}40` }}
            >
              {visueel.label}
            </span>
            {item.aantalKolommenAangemaakt !== undefined && item.aantalKolommenAangemaakt > 0 && (
              <span className={styles.aantalBadge}>+{item.aantalKolommenAangemaakt} aangemaakt</span>
            )}
          </Stack>
          <Text className={styles.itemBeschrijving}>{item.beschrijving}</Text>
        </Stack>
        {kanAanmaken && (
          <TooltipHost content={`"${item.label}" aanmaken`}>
            <ActionButton
              iconProps={{ iconName: 'Add' }}
              text="Aanmaken"
              onClick={() => onEnkelAanmaken(item.id)}
              disabled={isGlobaalBezig}
              className={styles.enkelKnop}
            />
          </TooltipHost>
        )}
      </Stack>
      {item.status === 'fout' && item.foutmelding && (
        <Stack styles={{ root: { paddingLeft: 28 } }}>
          <Text className={styles.foutText}>{item.foutmelding}</Text>
        </Stack>
      )}
    </Stack>
  );
};

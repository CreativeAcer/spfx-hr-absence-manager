// ============================================================
// components/setup/SetupPanel.tsx
// ============================================================
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Panel, PanelType, Stack, Text,
  PrimaryButton, DefaultButton, ActionButton,
  Spinner, SpinnerSize, MessageBar, MessageBarType,
  Separator, ProgressIndicator, Icon, TooltipHost,
} from '@fluentui/react';
import { ISetupItem, SetupItemStatus, setupService } from '../../services/SetupService';
import styles from './SetupPanel.module.scss';

interface ISetupPanelProps {
  isOpen: boolean;
  onSluit: () => void;
}

interface IStatusVisueel { icoon: string; kleur: string; label: string; }

function getStatusVisueel(status: SetupItemStatus): IStatusVisueel {
  switch (status) {
    case 'bestaat':   return { icoon: 'CheckMark',      kleur: '#107c10', label: 'Bestaat al'  };
    case 'ontbreekt': return { icoon: 'Warning',         kleur: '#ca5010', label: 'Ontbreekt'   };
    case 'bezig':     return { icoon: 'Sync',            kleur: '#0078d4', label: 'Bezig...'    };
    case 'klaar':     return { icoon: 'CheckMark',       kleur: '#107c10', label: 'Aangemaakt'  };
    case 'fout':      return { icoon: 'ErrorBadge',      kleur: '#a4262c', label: 'Fout'        };
    default:          return { icoon: 'CircleHalfFull',  kleur: '#605e5c', label: 'Onbekend'    };
  }
}

// Map status naar scss klasse — 'onbekend' valt terug op lege string
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

const SetupStatusItem: React.FC<ISetupStatusItemProps> = ({ item, onEnkelAanmaken, isGlobaalBezig }) => {
  const visueel = getStatusVisueel(item.status);
  const isBezig = item.status === 'bezig';
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
          <Text className={styles.foutText}>⚠️ {item.foutmelding}</Text>
        </Stack>
      )}
    </Stack>
  );
};

export const SetupPanel: React.FC<ISetupPanelProps> = ({ isOpen, onSluit }) => {
  const [items, setItems] = useState<ISetupItem[]>([]);
  const [isScanBezig, setIsScanBezig] = useState(false);
  const [isProvisionBezig, setIsProvisionBezig] = useState(false);
  const [voortgangLog, setVoortgangLog] = useState<string[]>([]);
  const [scanFout, setScanFout] = useState<string | undefined>(undefined);
  const [allesKlaar, setAllesKlaar] = useState(false);

  const updateItem = useCallback((id: string, updates: Partial<ISetupItem>) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const logVoortgang = useCallback((bericht: string) => {
    setVoortgangLog((prev) => [...prev, bericht]);
  }, []);

  const voerScanUit = useCallback(async (): Promise<void> => {
    setIsScanBezig(true);
    setScanFout(undefined);
    setVoortgangLog([]);
    setAllesKlaar(false);
    try {
      const resultaat = await setupService.scanStructuren();
      setItems(resultaat);
    } catch {
      setScanFout('Kon de SharePoint structuren niet controleren. Verifieer je rechten en probeer opnieuw.');
    } finally {
      setIsScanBezig(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) { voerScanUit().catch(console.error); }
  }, [isOpen, voerScanUit]);

  const handleProvisionAlles = async (): Promise<void> => {
    setIsProvisionBezig(true);
    setVoortgangLog([]);
    setAllesKlaar(false);
    await setupService.provisionAlles(
      logVoortgang,
      (id, status, aantal, fout) => updateItem(id, { status, aantalKolommenAangemaakt: aantal, foutmelding: fout })
    );
    setIsProvisionBezig(false);
    setAllesKlaar(true);
  };

  const handleEnkelAanmaken = async (id: string): Promise<void> => {
    setIsProvisionBezig(true);
    setVoortgangLog([]);
    updateItem(id, { status: 'bezig', foutmelding: undefined });
    try {
      const aantal = await setupService.provisionItem(id, logVoortgang);
      updateItem(id, { status: 'klaar', aantalKolommenAangemaakt: aantal });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      updateItem(id, { status: 'fout', foutmelding: msg });
    } finally {
      setIsProvisionBezig(false);
    }
  };

  const aantalOntbrekend = items.filter((i) => i.status === 'ontbreekt' || i.status === 'fout').length;
  const aantalKlaar      = items.filter((i) => i.status === 'bestaat'   || i.status === 'klaar').length;
  const isAllesAanwezig  = aantalOntbrekend === 0 && items.length > 0;

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onSluit}
      type={PanelType.medium}
      headerText="⚙️ SharePoint Structuren Setup"
      closeButtonAriaLabel="Sluiten"
      onRenderFooterContent={() => (
        <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { padding: '16px 0' } }}>
          <PrimaryButton
            text={isProvisionBezig ? 'Bezig...' : `Alles aanmaken (${aantalOntbrekend})`}
            iconProps={{ iconName: 'BuildDefinition' }}
            onClick={() => { handleProvisionAlles().catch(console.error); }}
            disabled={isProvisionBezig || isScanBezig || aantalOntbrekend === 0}
          />
          <DefaultButton
            text="Opnieuw scannen"
            iconProps={{ iconName: 'Refresh' }}
            onClick={() => { voerScanUit().catch(console.error); }}
            disabled={isProvisionBezig || isScanBezig}
          />
          <DefaultButton text="Sluiten" onClick={onSluit} />
        </Stack>
      )}
      isFooterAtBottom
    >
      <Stack tokens={{ childrenGap: 20 }} styles={{ root: { paddingTop: 16 } }}>
        <MessageBar messageBarType={MessageBarType.info} isMultiline>
          Deze wizard controleert of alle vereiste SharePoint lijsten en libraries aanwezig zijn en maakt
          ontbrekende structuren automatisch aan. <strong>Bestaande lijsten en kolommen worden nooit gewijzigd.</strong>
        </MessageBar>

        {isScanBezig && (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 8 }}>
            <Spinner size={SpinnerSize.medium} />
            <Text styles={{ root: { color: '#605e5c' } }}>SharePoint structuren controleren...</Text>
          </Stack>
        )}

        {scanFout && <MessageBar messageBarType={MessageBarType.error} isMultiline>{scanFout}</MessageBar>}

        {!isScanBezig && items.length > 0 && (
          <Stack
            className={isAllesAanwezig ? styles.samenvattingKlaar : styles.samenvattingActie}
            tokens={{ childrenGap: 6 }}
          >
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Icon
                iconName={isAllesAanwezig ? 'CheckMark' : 'Info'}
                styles={{ root: { color: isAllesAanwezig ? '#107c10' : '#ca5010', fontSize: 20 } }}
              />
              <Text styles={{ root: { fontWeight: 600 } }}>
                {isAllesAanwezig
                  ? '✅ Alle structuren zijn aanwezig.'
                  : `${aantalOntbrekend} van ${items.length} structuren ontbreken nog.`}
              </Text>
            </Stack>
            {!isAllesAanwezig && (
              <ProgressIndicator percentComplete={aantalKlaar / items.length} styles={{ root: { width: '100%' } }} />
            )}
          </Stack>
        )}

        {allesKlaar && (
          <MessageBar messageBarType={MessageBarType.success} isMultiline>
            <strong>Setup voltooid!</strong> Alle SharePoint structuren zijn aangemaakt.
          </MessageBar>
        )}

        {!isScanBezig && items.length > 0 && (
          <>
            <Separator><Text styles={{ root: { color: '#605e5c', fontSize: 12 } }}>VEREISTE STRUCTUREN</Text></Separator>
            <Stack tokens={{ childrenGap: 10 }}>
              {items.map((item) => (
                <SetupStatusItem
                  key={item.id}
                  item={item}
                  onEnkelAanmaken={(id) => { handleEnkelAanmaken(id).catch(console.error); }}
                  isGlobaalBezig={isProvisionBezig}
                />
              ))}
            </Stack>
          </>
        )}

        {voortgangLog.length > 0 && (
          <>
            <Separator><Text styles={{ root: { color: '#605e5c', fontSize: 12 } }}>VOORTGANG LOG</Text></Separator>
            <Stack className={styles.logContainer} tokens={{ childrenGap: 3 }}>
              {voortgangLog.map((regel, index) => (
                <Text key={index} className={styles.logRegel}>{regel}</Text>
              ))}
              {isProvisionBezig && (
                <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
                  <Spinner size={SpinnerSize.xSmall} />
                  <Text className={styles.logRegel} styles={{ root: { color: '#0078d4' } }}>Bezig...</Text>
                </Stack>
              )}
            </Stack>
          </>
        )}

        <MessageBar messageBarType={MessageBarType.warning} isMultiline>
          <Text variant="small">
            <strong>Vereiste rechten:</strong> Je hebt <em>Site Owner</em> rechten nodig om lijsten aan te maken.
          </Text>
        </MessageBar>
      </Stack>
    </Panel>
  );
};

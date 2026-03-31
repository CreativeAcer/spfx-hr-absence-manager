// ============================================================
// components/setup/SetupPanel.tsx
// ============================================================
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Panel, PanelType, Stack, Text,
  PrimaryButton, DefaultButton,
  Spinner, SpinnerSize, MessageBar, MessageBarType,
  Separator, ProgressIndicator, Icon,
} from '@fluentui/react';
import { ISetupItem, setupService } from '../../services/SetupService';
import { SetupStatusItem } from './SetupStatusItem';
import styles from './SetupPanel.module.scss';

interface ISetupPanelProps {
  isOpen: boolean;
  onSluit: () => void;
}

interface ILogRegel {
  id: string;
  tekst: string;
}

export const SetupPanel: React.FC<ISetupPanelProps> = ({ isOpen, onSluit }) => {
  const [items, setItems] = useState<ISetupItem[]>([]);
  const [isScanBezig, setIsScanBezig] = useState(false);
  const [isProvisionBezig, setIsProvisionBezig] = useState(false);
  const [voortgangLog, setVoortgangLog] = useState<ILogRegel[]>([]);
  const [scanFout, setScanFout] = useState<string | undefined>(undefined);
  const [allesKlaar, setAllesKlaar] = useState(false);

  const updateItem = useCallback((id: string, updates: Partial<ISetupItem>) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const logVoortgang = useCallback((tekst: string) => {
    setVoortgangLog((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, tekst }]);
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

  const handleProvisionAlles = useCallback(async (): Promise<void> => {
    setIsProvisionBezig(true);
    setVoortgangLog([]);
    setAllesKlaar(false);
    await setupService.provisionAlles(
      logVoortgang,
      (id, status, aantal, fout) => updateItem(id, { status, aantalKolommenAangemaakt: aantal, foutmelding: fout })
    );
    setIsProvisionBezig(false);
    setAllesKlaar(true);
  }, [logVoortgang, updateItem]);

  const handleEnkelAanmaken = useCallback(async (id: string): Promise<void> => {
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
  }, [logVoortgang, updateItem]);

  const aantalOntbrekend = items.filter((i) => i.status === 'ontbreekt' || i.status === 'fout').length;
  const aantalKlaar      = items.filter((i) => i.status === 'bestaat'   || i.status === 'klaar').length;
  const isAllesAanwezig  = aantalOntbrekend === 0 && items.length > 0;

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onSluit}
      type={PanelType.medium}
      headerText="SharePoint Structuren Setup"
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
                  ? 'Alle structuren zijn aanwezig.'
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
              {voortgangLog.map((regel) => (
                <Text key={regel.id} className={styles.logRegel}>{regel.tekst}</Text>
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

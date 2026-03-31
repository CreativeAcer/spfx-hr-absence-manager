// ============================================================
// components/HrZiektebriefjesApp.tsx
// ============================================================
import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import {
  Stack, Text, MessageBar, MessageBarType,
  Spinner, SpinnerSize, SearchBox, Dropdown,
  IDropdownOption, CommandBar, ICommandBarItemProps,
} from '@fluentui/react';
import { IAfwezigheid, AfwezigheidStatus } from '../models';
import { useAfwezigheden } from '../hooks/useAfwezigheden';
import { setupService } from '../services/SetupService';
import { KpiHeader } from './dashboard/KpiHeader';
import { AfwezighedenTable } from './table/AfwezighedenTable';
import { VerlengModal } from './modals/VerlengModal';
import { TeRugActiefModal } from './modals/TeRugActiefModal';
import { SetupPanel } from './setup/SetupPanel';
import { PendingDocumentenSection } from './pending/PendingDocumentenSection';
import { ErrorBoundary } from './shared/ErrorBoundary';
import styles from './HrZiektebriefjesApp.module.scss';

type ModalType = 'verleng' | 'terug_actief' | undefined;
type StatusFilterKey = 'ziek' | 'niet_actief' | 'alle' | 'verlopend' | AfwezigheidStatus;

export const HrZiektebriefjesApp: React.FC = () => {
  const {
    afwezigheden, pendingDocumenten, settings, kpis,
    isLoading, isActieBezig, fout,
    herlaad, verleng, zetTeRugActief, maakAfwezigheidAan, negeerDocument,
  } = useAfwezigheden();

  const [zoekterm, setZoekterm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('ziek');
  const [geselecteerde, setGeselecteerde] = useState<IAfwezigheid | undefined>(undefined);
  const [actieveModal, setActieveModal] = useState<ModalType>(undefined);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSiteOwner, setIsSiteOwner] = useState(false);

  useEffect(() => {
    setupService.isCurrentUserSiteOwner()
      .then(setIsSiteOwner)
      .catch(() => setIsSiteOwner(false));
  }, []);

  const gefiltered = useMemo(() => afwezigheden.filter((a) => {
    const matchZoek = !zoekterm
      || a.persoon.displayName.toLowerCase().includes(zoekterm.toLowerCase())
      || (a.afdeling ?? '').toLowerCase().includes(zoekterm.toLowerCase());
    const matchStatus =
      statusFilter === 'alle'
      || (statusFilter === 'ziek' && (a.status === 'Ziekteverlof' || a.status === 'Verlengd'))
      || (statusFilter === 'niet_actief' && a.status !== 'Actief')
      || a.status === statusFilter
      || (statusFilter === 'verlopend' && a.isVerlopend);
    return matchZoek && matchStatus;
  }), [afwezigheden, zoekterm, statusFilter]);

  const statusOpties = useMemo<IDropdownOption[]>(() => [
    { key: 'ziek',         text: 'Enkel ziekteverlof' },
    { key: 'niet_actief',  text: 'Alles behalve Actief' },
    { key: 'alle',         text: 'Alle statussen' },
    { key: 'Ziekteverlof', text: 'Ziekteverlof' },
    { key: 'Verlengd',     text: 'Verlengd' },
    { key: 'Actief',       text: 'Actief (terug op het werk)' },
    { key: 'verlopend',    text: 'Verloopt binnenkort' },
  ], []);

  const commandBarItems = useMemo<ICommandBarItemProps[]>(() => [
    {
      key: 'herlaad',
      text: 'Vernieuwen',
      iconProps: { iconName: 'Refresh' },
      onClick: () => { herlaad().catch(console.error); },
      disabled: isLoading,
    },
    ...(isSiteOwner ? [{
      key: 'setup',
      text: 'Structuren setup',
      iconProps: { iconName: 'BuildDefinition' },
      onClick: () => setIsSetupOpen(true),
    }] : []),
  ], [isLoading, isSiteOwner, herlaad]);

  const sluitModal = (): void => {
    setActieveModal(undefined);
    setGeselecteerde(undefined);
  };

  if (isLoading) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" className={styles.loadingContainer}>
        <Spinner size={SpinnerSize.large} label="Gegevens laden..." />
      </Stack>
    );
  }

  return (
    <ErrorBoundary>
      <Stack className={styles.appContainer} tokens={{ childrenGap: 16 }}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center" className={styles.appHeader}>
          <Stack>
            <Text variant="xxLarge" className={styles.appTitle}>HR Ziektebriefjes</Text>
            <Text variant="medium" className={styles.appSubtitle}>Beheer van afwezigheden en ziektedossiers</Text>
          </Stack>
          <CommandBar items={commandBarItems} styles={{ root: { padding: 0 } }} />
        </Stack>

        {fout && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false} dismissButtonAriaLabel="Sluiten">
            {fout}
          </MessageBar>
        )}

        {kpis && <KpiHeader kpis={kpis} />}

        <PendingDocumentenSection
          documenten={pendingDocumenten}
          isBezig={isActieBezig}
          onAanmaken={maakAfwezigheidAan}
          onNegeren={negeerDocument}
        />

        <Stack horizontal tokens={{ childrenGap: 12 }} className={styles.filterBar} wrap>
          <SearchBox
            placeholder="Zoek op naam, afdeling..."
            value={zoekterm}
            onChange={(_, val) => setZoekterm(val ?? '')}
            onClear={() => setZoekterm('')}
            className={styles.searchBox}
          />
          <Dropdown
            options={statusOpties}
            selectedKey={statusFilter}
            onChange={(_, opt) => setStatusFilter((opt?.key as StatusFilterKey) ?? 'alle')}
            className={styles.statusDropdown}
          />
          <Text variant="small" className={styles.resultTelling}>
            {gefiltered.length} van {afwezigheden.length} afwezigheden
          </Text>
        </Stack>

        <ErrorBoundary>
          <AfwezighedenTable
            afwezigheden={gefiltered}
            onVerleng={(a) => { setGeselecteerde(a); setActieveModal('verleng'); }}
            onTeRugActief={(a) => { setGeselecteerde(a); setActieveModal('terug_actief'); }}
            isActieBezig={isActieBezig}
            maxVerlengingen={settings?.maxVerlengingen ?? 3}
          />
        </ErrorBoundary>

        {actieveModal === 'verleng' && geselecteerde && (
          <VerlengModal
            key={`verleng-${geselecteerde.id}`}
            afwezigheid={geselecteerde}
            isOpen={true}
            isBezig={isActieBezig}
            maxVerlengingen={settings?.maxVerlengingen ?? 3}
            onBevestig={async (formData) => { await verleng(geselecteerde.id, formData); sluitModal(); }}
            onAnnuleer={sluitModal}
          />
        )}

        {actieveModal === 'terug_actief' && geselecteerde && (
          <TeRugActiefModal
            key={`terug-${geselecteerde.id}`}
            afwezigheid={geselecteerde}
            isOpen={true}
            isBezig={isActieBezig}
            onBevestig={async (formData) => { await zetTeRugActief(geselecteerde.id, formData); sluitModal(); }}
            onAnnuleer={sluitModal}
          />
        )}

        <SetupPanel isOpen={isSetupOpen} onSluit={() => setIsSetupOpen(false)} />
      </Stack>
    </ErrorBoundary>
  );
};

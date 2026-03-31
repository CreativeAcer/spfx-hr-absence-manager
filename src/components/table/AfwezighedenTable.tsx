// ============================================================
// components/table/AfwezighedenTable.tsx
// ============================================================
import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  DetailsList, IColumn, DetailsListLayoutMode, SelectionMode,
  Stack, Text, ActionButton, TooltipHost, Icon,
} from '@fluentui/react';
import { IAfwezigheid } from '../../models';
import { DREMPEL_DAGEN } from '../../constants';
import { formatDatum } from '../../utils/dateUtils';
import { StatusBadge } from './StatusBadge';
import { DocumentBadge } from './DocumentBadge';
import { AuditLogPanel } from '../shared/AuditLogPanel';
import styles from './AfwezighedenTable.module.scss';

interface IAfwezighedenTableProps {
  afwezigheden: IAfwezigheid[];
  onVerleng: (afwezigheid: IAfwezigheid) => void;
  onTeRugActief: (afwezigheid: IAfwezigheid) => void;
  isActieBezig: boolean;
  maxVerlengingen: number;
}

const DagenLabel: React.FC<{ dagen: number }> = ({ dagen }) => {
  if (dagen < 0)                        return <Text className={styles.verlopenText}>Verlopen ({Math.abs(dagen)} dgn geleden)</Text>;
  if (dagen <= DREMPEL_DAGEN.KRITIEK)   return <Text className={styles.kritiekText}>Nog {dagen} dag{dagen === 1 ? '' : 'en'}</Text>;
  if (dagen <= DREMPEL_DAGEN.WAARSCHUWING) return <Text className={styles.waarschuwingText}>Nog {dagen} dagen</Text>;
  return <Text className={styles.okText}>{dagen} dagen</Text>;
};

const kanVerlengd    = (a: IAfwezigheid): boolean => a.status !== 'Actief' && a.status !== 'Gearchiveerd';
const kanTeRugActief = (a: IAfwezigheid): boolean => a.status === 'Ziekteverlof' || a.status === 'Verlengd';

export const AfwezighedenTable: React.FC<IAfwezighedenTableProps> = ({
  afwezigheden, onVerleng, onTeRugActief, isActieBezig, maxVerlengingen,
}) => {
  const [auditId, setAuditId] = useState<number | undefined>(undefined);

  const isMaxBereikt = (a: IAfwezigheid): boolean => a.aantalVerlengingen >= maxVerlengingen;

  const columns = useMemo<IColumn[]>(() => [
    {
      key: 'persoon', name: 'Medewerker', fieldName: 'persoon',
      minWidth: 160, maxWidth: 220, isResizable: true,
      onRender: (item: IAfwezigheid) => (
        <Stack tokens={{ childrenGap: 2 }}>
          <Text className={styles.persoonNaam}>{item.persoon.displayName}</Text>
          {item.afdeling && <Text className={styles.afdelingText}>{item.afdeling}</Text>}
        </Stack>
      ),
    },
    {
      key: 'begindatum', name: 'Begin', fieldName: 'begindatum',
      minWidth: 90, maxWidth: 100, isResizable: true,
      onRender: (item: IAfwezigheid) => <Text>{formatDatum(item.begindatum)}</Text>,
    },
    {
      key: 'einddatum', name: 'Einde', fieldName: 'einddatum',
      minWidth: 90, maxWidth: 120, isResizable: true,
      onRender: (item: IAfwezigheid) => (
        <Stack tokens={{ childrenGap: 2 }}>
          <Text>{formatDatum(item.einddatum)}</Text>
          {item.origineelEinde && (
            <TooltipHost content={`Origineel: ${formatDatum(item.origineelEinde)}`}>
              <Text className={styles.origineelText}>(orig. {formatDatum(item.origineelEinde)})</Text>
            </TooltipHost>
          )}
        </Stack>
      ),
    },
    {
      key: 'restTijd', name: 'Resterende tijd', fieldName: 'dagenTotEinde',
      minWidth: 120, maxWidth: 150, isResizable: true,
      onRender: (item: IAfwezigheid) => {
        if (item.status === 'Actief') return <Text className={styles.teRugActiefText}>Terug op het werk</Text>;
        return <DagenLabel dagen={item.dagenTotEinde ?? 0} />;
      },
    },
    {
      key: 'status', name: 'Status', fieldName: 'status',
      minWidth: 110, maxWidth: 140, isResizable: true,
      onRender: (item: IAfwezigheid) => (
        <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
          <StatusBadge status={item.status} />
          {item.aantalVerlengingen > 0 && (
            <TooltipHost content={`${item.aantalVerlengingen} keer verlengd`}>
              <Text className={styles.verlengingBadge}>×{item.aantalVerlengingen}</Text>
            </TooltipHost>
          )}
        </Stack>
      ),
    },
    {
      key: 'document', name: 'Document', fieldName: 'documentLink',
      minWidth: 80, maxWidth: 110, isResizable: true,
      onRender: (item: IAfwezigheid) => <DocumentBadge afwezigheidId={item.id} />,
    },
    {
      key: 'aangepast', name: 'Laatste wijziging', fieldName: 'aangepastOp',
      minWidth: 130, maxWidth: 170, isResizable: true,
      onRender: (item: IAfwezigheid) => (
        <Stack tokens={{ childrenGap: 2 }}>
          {item.aangepastOp && <Text className={styles.datumText}>{formatDatum(item.aangepastOp)}</Text>}
          {item.aangepastDoor && <Text className={styles.doorText}>{item.aangepastDoor.displayName}</Text>}
        </Stack>
      ),
    },
    {
      key: 'acties', name: 'Acties', fieldName: 'acties',
      minWidth: 200, maxWidth: 250,
      onRender: (item: IAfwezigheid) => (
        <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
          {kanVerlengd(item) && (
            <TooltipHost content={isMaxBereikt(item) ? `Max. ${maxVerlengingen} verlengingen bereikt` : 'Verlenging registreren'}>
              <ActionButton
                iconProps={{ iconName: 'CalendarSettings' }}
                text="Verleng"
                onClick={() => { if (!isMaxBereikt(item)) onVerleng(item); }}
                disabled={isActieBezig || isMaxBereikt(item)}
                className={styles.verlengKnop}
              />
            </TooltipHost>
          )}
          {kanTeRugActief(item) && (
            <ActionButton
              iconProps={{ iconName: 'CheckMark' }}
              text="Terug actief"
              onClick={() => onTeRugActief(item)}
              disabled={isActieBezig}
              className={styles.teRugActiefKnop}
            />
          )}
          <TooltipHost content="Wijzigingshistoriek bekijken">
            <ActionButton
              iconProps={{ iconName: 'History' }}
              onClick={() => setAuditId(item.id)}
              disabled={isActieBezig}
              className={styles.historiekKnop}
              ariaLabel="Wijzigingshistoriek"
            />
          </TooltipHost>
        </Stack>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isActieBezig, maxVerlengingen, onVerleng, onTeRugActief]);

  if (afwezigheden.length === 0) {
    return (
      <Stack horizontalAlign="center" className={styles.geenResultaten}>
        <Icon iconName="People" className={styles.geenResultatenIcon} />
        <Text variant="large">Geen afwezigheden gevonden</Text>
        <Text variant="medium">Pas de filters aan of controleer de SharePoint lijsten.</Text>
      </Stack>
    );
  }

  return (
    <>
      <DetailsList
        items={afwezigheden}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        isHeaderVisible
        className={styles.tabel}
        getKey={(item: IAfwezigheid) => `afwezigheid-${item.id}`}
        ariaLabelForGrid="Afwezigheidsoverzicht"
        onRenderRow={(props, defaultRender) => {
          if (!props || !defaultRender) return null;
          return defaultRender({
            ...props,
            className: props.item?.isVerlopend ? styles.verlopendRij : '',
          });
        }}
      />
      {auditId !== undefined && (
        <AuditLogPanel
          afwezigheidId={auditId}
          isOpen={true}
          onSluit={() => setAuditId(undefined)}
        />
      )}
    </>
  );
};

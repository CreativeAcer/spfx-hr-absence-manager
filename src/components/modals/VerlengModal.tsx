// ============================================================
// components/modals/VerlengModal.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import { DatePicker, Stack, Text, DayOfWeek } from '@fluentui/react';
import { IAfwezigheid, IVerlengFormData } from '../../models';
import { NL_DATEPICKER_STRINGS } from '../../constants';
import { formatDatum, MS_PER_DAY } from '../../utils/dateUtils';
import { StatusBadge } from '../table/StatusBadge';
import { AbsenceActionModal, IAbsenceFormData } from './AbsenceActionModal';

interface IVerlengModalProps {
  afwezigheid: IAfwezigheid;
  isOpen: boolean;
  isBezig: boolean;
  maxVerlengingen: number;
  onBevestig: (formData: IVerlengFormData) => Promise<void>;
  onAnnuleer: () => void;
}

export const VerlengModal: React.FC<IVerlengModalProps> = ({
  afwezigheid, isOpen, isBezig, maxVerlengingen, onBevestig, onAnnuleer,
}) => {
  const [nieuweEinddatum, setNieuweEinddatum] = useState<Date | undefined>(undefined);
  const minDatum = new Date(afwezigheid.einddatum.getTime() + MS_PER_DAY);

  const validate = (): string | undefined => {
    if (!nieuweEinddatum) return 'Selecteer een nieuwe einddatum.';
    if (nieuweEinddatum <= afwezigheid.einddatum) return 'De nieuwe einddatum moet na de huidige einddatum liggen.';
    return undefined;
  };

  const handleBevestig = async (base: IAbsenceFormData): Promise<void> => {
    await onBevestig({ nieuweEinddatum: nieuweEinddatum!, ...base });
  };

  const summaryContent = (
    <Stack tokens={{ childrenGap: 8 }} styles={{ root: { background: '#f8f8f8', padding: 12, borderRadius: 4 } }}>
      <Text variant="mediumPlus"><strong>{afwezigheid.persoon.displayName}</strong></Text>
      <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
        <Text variant="small">Begin: {formatDatum(afwezigheid.begindatum)}</Text>
        <Text variant="small">Einde: {formatDatum(afwezigheid.einddatum)}</Text>
        <StatusBadge status={afwezigheid.status} />
      </Stack>
    </Stack>
  );

  const dateContent = (
    <DatePicker
      label="Nieuwe einddatum *"
      isRequired
      value={nieuweEinddatum}
      onSelectDate={(d) => setNieuweEinddatum(d ?? undefined)}
      minDate={minDatum}
      firstDayOfWeek={DayOfWeek.Monday}
      strings={NL_DATEPICKER_STRINGS}
      placeholder="Selecteer nieuwe einddatum"
      formatDate={(d) => d?.toLocaleDateString('nl-BE') ?? ''}
      disabled={isBezig}
    />
  );

  const bevestigingBericht = nieuweEinddatum
    ? `Verlengd tot ${formatDatum(nieuweEinddatum)}. Een notificatiemail wordt verstuurd.`
    : '';

  return (
    <AbsenceActionModal
      afwezigheid={afwezigheid}
      isOpen={isOpen}
      isBezig={isBezig}
      titel="Verlenging registreren"
      subTekst={`Verlenging ${(afwezigheid.aantalVerlengingen ?? 0) + 1} van ${maxVerlengingen}`}
      bevestigLabel="Verleng"
      definitiefBevestigLabel="Bevestig verlenging"
      summaryContent={summaryContent}
      dateContent={dateContent}
      validate={validate}
      onBevestig={handleBevestig}
      onAnnuleer={onAnnuleer}
      bevestigingBericht={bevestigingBericht}
      isPrimaryDisabled={!nieuweEinddatum}
    />
  );
};

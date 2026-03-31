// ============================================================
// components/modals/TeRugActiefModal.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import { DatePicker, Stack, Text, DayOfWeek } from '@fluentui/react';
import { IAfwezigheid, ITeRugActiefFormData } from '../../models';
import { NL_DATEPICKER_STRINGS } from '../../constants';
import { formatDatum, berekenDagenVerschil } from '../../utils/dateUtils';
import { AbsenceActionModal, IAbsenceFormData } from './AbsenceActionModal';

interface ITeRugActiefModalProps {
  afwezigheid: IAfwezigheid;
  isOpen: boolean;
  isBezig: boolean;
  onBevestig: (formData: ITeRugActiefFormData) => Promise<void>;
  onAnnuleer: () => void;
}

const GREEN_BUTTON_STYLES = { root: { backgroundColor: '#107c10', border: 'none' } };

export const TeRugActiefModal: React.FC<ITeRugActiefModalProps> = ({
  afwezigheid, isOpen, isBezig, onBevestig, onAnnuleer,
}) => {
  const [definitieveEinddatum, setDefinitieveEinddatum] = useState<Date | undefined>(new Date());

  const totaleDuurDagen = definitieveEinddatum
    ? berekenDagenVerschil(afwezigheid.begindatum, definitieveEinddatum)
    : 0;

  const validate = (): string | undefined => {
    if (!definitieveEinddatum) return 'Selecteer de definitieve terugkeerdatum.';
    return undefined;
  };

  const handleBevestig = async (base: IAbsenceFormData): Promise<void> => {
    await onBevestig({ definitieveEinddatum: definitieveEinddatum!, ...base });
  };

  const summaryContent = (
    <Stack
      tokens={{ childrenGap: 8 }}
      styles={{ root: { background: '#f0fff0', padding: 12, borderRadius: 4, border: '1px solid #107c10' } }}
    >
      <Text variant="mediumPlus"><strong>{afwezigheid.persoon.displayName}</strong></Text>
      <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
        <Text variant="small">Begin: {formatDatum(afwezigheid.begindatum)}</Text>
        <Text variant="small">Gepland einde: {formatDatum(afwezigheid.einddatum)}</Text>
      </Stack>
      {afwezigheid.aantalVerlengingen > 0 && (
        <Text variant="small">{afwezigheid.aantalVerlengingen}× verlengd</Text>
      )}
      {definitieveEinddatum && (
        <Text variant="small" styles={{ root: { color: '#107c10', fontWeight: 600 } }}>
          Totale duur: {totaleDuurDagen} kalenderdagen
        </Text>
      )}
    </Stack>
  );

  const dateContent = (
    <DatePicker
      label="Definitieve terugkeerdatum *"
      isRequired
      value={definitieveEinddatum}
      onSelectDate={(d) => setDefinitieveEinddatum(d ?? undefined)}
      firstDayOfWeek={DayOfWeek.Monday}
      strings={NL_DATEPICKER_STRINGS}
      placeholder="Selecteer de terugkeerdatum"
      formatDate={(d) => d?.toLocaleDateString('nl-BE') ?? ''}
      disabled={isBezig}
    />
  );

  const bevestigingBericht =
    'De status wordt gewijzigd naar "Actief" en een notificatiemail wordt verstuurd.';

  return (
    <AbsenceActionModal
      afwezigheid={afwezigheid}
      isOpen={isOpen}
      isBezig={isBezig}
      titel="Medewerker terug actief"
      subTekst={`${afwezigheid.persoon.displayName} terugzetten als actief`}
      bevestigLabel="Terug actief zetten"
      definitiefBevestigLabel="Bevestig terugkeer"
      primaryButtonStyles={GREEN_BUTTON_STYLES}
      summaryContent={summaryContent}
      dateContent={dateContent}
      validate={validate}
      onBevestig={handleBevestig}
      onAnnuleer={onAnnuleer}
      bevestigingBericht={bevestigingBericht}
      isPrimaryDisabled={!definitieveEinddatum}
    />
  );
};

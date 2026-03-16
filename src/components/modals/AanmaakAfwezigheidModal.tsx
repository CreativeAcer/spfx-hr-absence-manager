// ============================================================
// components/modals/AanmaakAfwezigheidModal.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import {
  Modal, Stack, Text, PrimaryButton, DefaultButton,
  DatePicker, DayOfWeek, MessageBar, MessageBarType, Spinner, SpinnerSize,
} from '@fluentui/react';
import { IZiektebriefDocument } from '../../models';

interface IAanmaakAfwezigheidModalProps {
  document: IZiektebriefDocument;
  isOpen: boolean;
  isBezig: boolean;
  onBevestig: (begindatum: Date, einddatum: Date) => Promise<void>;
  onAnnuleer: () => void;
}

const NL_STRINGS = {
  months: ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'],
  shortMonths: ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'],
  days: ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'],
  shortDays: ['zo','ma','di','wo','do','vr','za'],
  goToToday: 'Naar vandaag',
};

export const AanmaakAfwezigheidModal: React.FC<IAanmaakAfwezigheidModalProps> = ({
  document, isOpen, isBezig, onBevestig, onAnnuleer,
}) => {
  const [begindatum, setBegindatum] = useState<Date | undefined>(document.aanvangsDatum);
  const [einddatum, setEinddatum] = useState<Date | undefined>(document.eindDatum);
  const [fout, setFout] = useState<string | undefined>(undefined);

  const handleBevestig = async (): Promise<void> => {
    if (!begindatum) { setFout('Begindatum is verplicht.'); return; }
    if (!einddatum) { setFout('Einddatum is verplicht.'); return; }
    if (einddatum < begindatum) { setFout('Einddatum moet na de begindatum liggen.'); return; }
    setFout(undefined);
    await onBevestig(begindatum, einddatum);
  };

  return (
    <Modal isOpen={isOpen} onDismiss={onAnnuleer} isBlocking={false}>
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: 24, minWidth: 400, maxWidth: 500 } }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>Afwezigheid aanmaken</Text>

        <Stack tokens={{ childrenGap: 4 }}>
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>Medewerker</Text>
          <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
            {document.persoon?.displayName ?? '—'}
          </Text>
        </Stack>

        <Stack tokens={{ childrenGap: 4 }}>
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>Bestand</Text>
          <Text variant="small">{document.fileName}</Text>
        </Stack>

        <DatePicker
          label="Begindatum *"
          value={begindatum}
          onSelectDate={(d) => setBegindatum(d ?? undefined)}
          firstDayOfWeek={DayOfWeek.Monday}
          strings={NL_STRINGS}
          formatDate={(d) => d ? d.toLocaleDateString('nl-BE') : ''}
          isRequired
        />

        <DatePicker
          label="Einddatum *"
          value={einddatum}
          onSelectDate={(d) => setEinddatum(d ?? undefined)}
          firstDayOfWeek={DayOfWeek.Monday}
          strings={NL_STRINGS}
          formatDate={(d) => d ? d.toLocaleDateString('nl-BE') : ''}
          isRequired
          minDate={begindatum}
        />

        {fout && (
          <MessageBar messageBarType={MessageBarType.error}>{fout}</MessageBar>
        )}

        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
          <DefaultButton text="Annuleren" onClick={onAnnuleer} disabled={isBezig} />
          <PrimaryButton
            text={isBezig ? '' : 'Aanmaken'}
            onClick={() => { handleBevestig().catch(console.error); }}
            disabled={isBezig}
            onRenderText={isBezig ? () => <Spinner size={SpinnerSize.small} /> : undefined}
          />
        </Stack>
      </Stack>
    </Modal>
  );
};

// ============================================================
// components/modals/VerlengModal.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import {
  Dialog, DialogType, DialogFooter,
  PrimaryButton, DefaultButton,
  DatePicker, TextField, Stack, Text,
  MessageBar, MessageBarType, Spinner, SpinnerSize, DayOfWeek,
  Separator, ActionButton,
} from '@fluentui/react';
import { IAfwezigheid, IVerlengFormData } from '../../models';
import { StatusBadge } from '../table/StatusBadge';
import { AuditLogInhoud } from '../shared/AuditLogInhoud';

interface IVerlengModalProps {
  afwezigheid: IAfwezigheid;
  isOpen: boolean;
  isBezig: boolean;
  maxVerlengingen: number;
  onBevestig: (formData: IVerlengFormData) => Promise<void>;
  onAnnuleer: () => void;
}

const DATEPICKER_STRINGS = {
  months: ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'],
  shortMonths: ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'],
  days: ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'],
  shortDays: ['Z','M','D','W','D','V','Z'],
  goToToday: 'Vandaag',
  prevMonthAriaLabel: 'Vorige maand',
  nextMonthAriaLabel: 'Volgende maand',
  prevYearAriaLabel: 'Vorig jaar',
  nextYearAriaLabel: 'Volgend jaar',
};

export const VerlengModal: React.FC<IVerlengModalProps> = ({
  afwezigheid, isOpen, isBezig, maxVerlengingen, onBevestig, onAnnuleer,
}) => {
  const [nieuweEinddatum, setNieuweEinddatum] = useState<Date | undefined>(undefined);
  const [opmerking, setOpmerking] = useState('');
  const [hrNota, setHrNota] = useState(afwezigheid.hrNota ?? '');
  const [fout, setFout] = useState<string | undefined>(undefined);
  const [bevestigd, setBevestigd] = useState(false);
  const [toonGeschiedenis, setToonGeschiedenis] = useState(false);

  const minDatum = new Date(afwezigheid.einddatum.getTime() + 24 * 60 * 60 * 1000);

  const handleBevestig = async (): Promise<void> => {
    setFout(undefined);
    if (!nieuweEinddatum) { setFout('Selecteer een nieuwe einddatum.'); return; }
    if (nieuweEinddatum <= afwezigheid.einddatum) { setFout('De nieuwe einddatum moet na de huidige einddatum liggen.'); return; }
    if (!bevestigd) { setBevestigd(true); return; }
    try {
      await onBevestig({ nieuweEinddatum, opmerking: opmerking || undefined, hrNota: hrNota || undefined });
    } catch {
      setFout('Er is een fout opgetreden bij het opslaan. Probeer opnieuw.');
      setBevestigd(false);
    }
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onAnnuleer}
      dialogContentProps={{ type: DialogType.normal, title: '🔄 Verlenging registreren', subText: `Verlenging ${(afwezigheid.aantalVerlengingen ?? 0) + 1} van ${maxVerlengingen}` }}
      modalProps={{ isBlocking: true }}
      minWidth={520}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {/* Samenvatting */}
        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { background: '#f8f8f8', padding: 12, borderRadius: 4 } }}>
          <Text variant="mediumPlus"><strong>{afwezigheid.persoon.displayName}</strong></Text>
          <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
            <Text variant="small">📅 Begin: {afwezigheid.begindatum.toLocaleDateString('nl-BE')}</Text>
            <Text variant="small">📅 Einde: {afwezigheid.einddatum.toLocaleDateString('nl-BE')}</Text>
            <StatusBadge status={afwezigheid.status} />
          </Stack>
        </Stack>

        {fout && <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>{fout}</MessageBar>}

        {bevestigd && !fout && (
          <MessageBar messageBarType={MessageBarType.warning}>
            <strong>Bevestiging vereist:</strong> Verlengd tot {nieuweEinddatum?.toLocaleDateString('nl-BE')}. Een notificatiemail wordt verstuurd. Klik nogmaals om te bevestigen.
          </MessageBar>
        )}

        <DatePicker
          label="Nieuwe einddatum *"
          isRequired
          value={nieuweEinddatum}
          onSelectDate={(d) => { setNieuweEinddatum(d ?? undefined); setBevestigd(false); setFout(undefined); }}
          minDate={minDatum}
          firstDayOfWeek={DayOfWeek.Monday}
          strings={DATEPICKER_STRINGS}
          placeholder="Selecteer nieuwe einddatum"
          formatDate={(d) => d?.toLocaleDateString('nl-BE') ?? ''}
          disabled={isBezig}
        />
        <TextField label="Opmerking bij verlenging" multiline rows={3} value={opmerking} onChange={(_, v) => setOpmerking(v ?? '')} disabled={isBezig} />
        <TextField label="Interne HR nota" multiline rows={2} value={hrNota} onChange={(_, v) => setHrNota(v ?? '')} disabled={isBezig} />

        {/* Collapsible geschiedenissectie */}
        <Separator />
        <ActionButton
          iconProps={{ iconName: toonGeschiedenis ? 'ChevronUp' : 'History' }}
          text={toonGeschiedenis ? 'Verberg geschiedenis' : '📋 Bekijk geschiedenis'}
          onClick={() => setToonGeschiedenis(!toonGeschiedenis)}
          styles={{ root: { padding: 0, height: 'auto', color: '#0078d4' } }}
        />
        {toonGeschiedenis && (
          <Stack
            tokens={{ childrenGap: 8 }}
            styles={{ root: { maxHeight: 280, overflowY: 'auto', border: '1px solid #edebe9', borderRadius: 4, padding: 12 } }}
          >
            <AuditLogInhoud afwezigheidId={afwezigheid.id} laden={toonGeschiedenis} />
          </Stack>
        )}
      </Stack>

      <DialogFooter>
        <PrimaryButton
          text={bevestigd ? '✅ Bevestig verlenging' : '🔄 Verlengen'}
          onClick={() => { handleBevestig().catch(console.error); }}
          disabled={isBezig || !nieuweEinddatum}
          onRenderText={() => isBezig
            ? <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center"><Spinner size={SpinnerSize.xSmall} /><span>Opslaan...</span></Stack>
            : <span>{bevestigd ? '✅ Bevestig verlenging' : '🔄 Verlengen'}</span>
          }
        />
        <DefaultButton text="Annuleren" onClick={onAnnuleer} disabled={isBezig} />
      </DialogFooter>
    </Dialog>
  );
};

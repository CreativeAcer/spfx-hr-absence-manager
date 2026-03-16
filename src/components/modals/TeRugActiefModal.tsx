// ============================================================
// components/modals/TeRugActiefModal.tsx
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
import { IAfwezigheid, ITeRugActiefFormData } from '../../models';
import { AuditLogInhoud } from '../shared/AuditLogInhoud';

interface ITeRugActiefModalProps {
  afwezigheid: IAfwezigheid;
  isOpen: boolean;
  isBezig: boolean;
  onBevestig: (formData: ITeRugActiefFormData) => Promise<void>;
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

export const TeRugActiefModal: React.FC<ITeRugActiefModalProps> = ({
  afwezigheid, isOpen, isBezig, onBevestig, onAnnuleer,
}) => {
  const [definitieveEinddatum, setDefinitieveEinddatum] = useState<Date | undefined>(new Date());
  const [opmerking, setOpmerking] = useState('');
  const [hrNota, setHrNota] = useState(afwezigheid.hrNota ?? '');
  const [fout, setFout] = useState<string | undefined>(undefined);
  const [bevestigd, setBevestigd] = useState(false);
  const [toonGeschiedenis, setToonGeschiedenis] = useState(false);

  const totaleDuurDagen = definitieveEinddatum
    ? Math.ceil((definitieveEinddatum.getTime() - afwezigheid.begindatum.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleBevestig = async (): Promise<void> => {
    setFout(undefined);
    if (!definitieveEinddatum) { setFout('Selecteer de definitieve terugkeerdatum.'); return; }
    if (!bevestigd) { setBevestigd(true); return; }
    try {
      await onBevestig({ definitieveEinddatum, opmerking: opmerking || undefined, hrNota: hrNota || undefined });
    } catch {
      setFout('Er is een fout opgetreden bij het opslaan. Probeer opnieuw.');
      setBevestigd(false);
    }
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onAnnuleer}
      dialogContentProps={{ type: DialogType.normal, title: '✅ Medewerker terug actief', subText: `${afwezigheid.persoon.displayName} terugzetten als actief` }}
      modalProps={{ isBlocking: true }}
      minWidth={520}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {/* Samenvatting */}
        <Stack
          tokens={{ childrenGap: 8 }}
          styles={{ root: { background: '#f0fff0', padding: 12, borderRadius: 4, border: '1px solid #107c10' } }}
        >
          <Text variant="mediumPlus"><strong>{afwezigheid.persoon.displayName}</strong></Text>
          <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
            <Text variant="small">📅 Begin: {afwezigheid.begindatum.toLocaleDateString('nl-BE')}</Text>
            <Text variant="small">📅 Gepland einde: {afwezigheid.einddatum.toLocaleDateString('nl-BE')}</Text>
          </Stack>
          {afwezigheid.aantalVerlengingen > 0 && (
            <Text variant="small">🔄 {afwezigheid.aantalVerlengingen}× verlengd</Text>
          )}
          {definitieveEinddatum && (
            <Text variant="small" styles={{ root: { color: '#107c10', fontWeight: 600 } }}>
              📊 Totale duur: {totaleDuurDagen} kalenderdagen
            </Text>
          )}
        </Stack>

        {fout && <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>{fout}</MessageBar>}

        {bevestigd && !fout && (
          <MessageBar messageBarType={MessageBarType.warning}>
            <strong>Bevestiging vereist:</strong> De status wordt gewijzigd naar &quot;Actief&quot; en een notificatiemail wordt verstuurd. Klik nogmaals om te bevestigen.
          </MessageBar>
        )}

        <DatePicker
          label="Definitieve terugkeerdatum *"
          isRequired
          value={definitieveEinddatum}
          onSelectDate={(d) => { setDefinitieveEinddatum(d ?? undefined); setBevestigd(false); setFout(undefined); }}
          firstDayOfWeek={DayOfWeek.Monday}
          strings={DATEPICKER_STRINGS}
          placeholder="Selecteer de terugkeerdatum"
          formatDate={(d) => d?.toLocaleDateString('nl-BE') ?? ''}
          disabled={isBezig}
        />
        <TextField label="Opmerking bij terugkeer" multiline rows={3} value={opmerking} onChange={(_, v) => setOpmerking(v ?? '')} disabled={isBezig} />
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
          text={bevestigd ? '✅ Bevestig terugkeer' : '✅ Terug actief zetten'}
          onClick={() => { handleBevestig().catch(console.error); }}
          disabled={isBezig || !definitieveEinddatum}
          styles={{ root: { backgroundColor: '#107c10', border: 'none' } }}
          onRenderText={() => isBezig
            ? <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center"><Spinner size={SpinnerSize.xSmall} /><span>Opslaan...</span></Stack>
            : <span>{bevestigd ? '✅ Bevestig terugkeer' : '✅ Terug actief zetten'}</span>
          }
        />
        <DefaultButton text="Annuleren" onClick={onAnnuleer} disabled={isBezig} />
      </DialogFooter>
    </Dialog>
  );
};

// ============================================================
// components/modals/AbsenceActionModal.tsx
// Shared shell for VerlengModal and TeRugActiefModal.
// Handles the common form fields, two-step confirmation,
// collapsible history section, and footer pattern.
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import {
  Dialog, DialogType, DialogFooter,
  PrimaryButton, DefaultButton,
  TextField, Stack, Text,
  MessageBar, MessageBarType, Spinner, SpinnerSize,
  Separator, ActionButton, IButtonStyles,
} from '@fluentui/react';
import { IAfwezigheid } from '../../models';
import { AuditLogInhoud } from '../shared/AuditLogInhoud';

export interface IAbsenceFormData {
  opmerking?: string;
  hrNota?: string;
}

interface IAbsenceActionModalProps {
  afwezigheid: IAfwezigheid;
  isOpen: boolean;
  isBezig: boolean;
  /** Dialog title */
  titel: string;
  /** Subtitle shown under the dialog title */
  subTekst: string;
  /** Primary button label before first click */
  bevestigLabel: string;
  /** Primary button label after first click (confirmation step) */
  definitiefBevestigLabel: string;
  /** Optional Fluent UI styles override for the primary button */
  primaryButtonStyles?: IButtonStyles;
  /** Summary box rendered at the top of the dialog body */
  summaryContent: React.ReactNode;
  /** Date picker rendered after the summary */
  dateContent: React.ReactNode;
  /** Validates the current state; returns an error string or undefined */
  validate: () => string | undefined;
  /** Called with form data when the user confirms (second click) */
  onBevestig: (data: IAbsenceFormData) => Promise<void>;
  onAnnuleer: () => void;
  /** Text shown in the confirmation banner after first click */
  bevestigingBericht: string;
  isPrimaryDisabled: boolean;
}

export const AbsenceActionModal: React.FC<IAbsenceActionModalProps> = ({
  afwezigheid, isOpen, isBezig,
  titel, subTekst, bevestigLabel, definitiefBevestigLabel,
  primaryButtonStyles, summaryContent, dateContent,
  validate, onBevestig, onAnnuleer, bevestigingBericht, isPrimaryDisabled,
}) => {
  const [opmerking, setOpmerking] = useState('');
  const [hrNota, setHrNota] = useState(afwezigheid.hrNota ?? '');
  const [fout, setFout] = useState<string | undefined>(undefined);
  const [bevestigd, setBevestigd] = useState(false);
  const [toonGeschiedenis, setToonGeschiedenis] = useState(false);

  const handlePrimaryClick = async (): Promise<void> => {
    setFout(undefined);
    const validatieFout = validate();
    if (validatieFout) { setFout(validatieFout); return; }
    if (!bevestigd) { setBevestigd(true); return; }
    try {
      await onBevestig({ opmerking: opmerking || undefined, hrNota: hrNota || undefined });
    } catch {
      setFout('Er is een fout opgetreden bij het opslaan. Probeer opnieuw.');
      setBevestigd(false);
    }
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onAnnuleer}
      dialogContentProps={{ type: DialogType.normal, title: titel, subText: subTekst }}
      modalProps={{ isBlocking: true }}
      minWidth={520}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {summaryContent}

        {fout && <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>{fout}</MessageBar>}

        {bevestigd && !fout && (
          <MessageBar messageBarType={MessageBarType.warning}>
            <strong>Bevestiging vereist:</strong> {bevestigingBericht} Klik nogmaals om te bevestigen.
          </MessageBar>
        )}

        {dateContent}

        <TextField
          label="Opmerking"
          multiline
          rows={3}
          maxLength={2000}
          value={opmerking}
          onChange={(_, v) => { setOpmerking(v ?? ''); setBevestigd(false); }}
          disabled={isBezig}
        />
        <TextField
          label="Interne HR nota"
          multiline
          rows={2}
          maxLength={1000}
          value={hrNota}
          onChange={(_, v) => { setHrNota(v ?? ''); setBevestigd(false); }}
          disabled={isBezig}
        />

        <Separator />
        <ActionButton
          iconProps={{ iconName: toonGeschiedenis ? 'ChevronUp' : 'History' }}
          text={toonGeschiedenis ? 'Verberg geschiedenis' : 'Bekijk geschiedenis'}
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
          text={bevestigd ? definitiefBevestigLabel : bevestigLabel}
          onClick={() => { handlePrimaryClick().catch(console.error); }}
          disabled={isBezig || isPrimaryDisabled}
          styles={primaryButtonStyles}
          onRenderText={() => isBezig
            ? <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center"><Spinner size={SpinnerSize.xSmall} /><span>Opslaan...</span></Stack>
            : <span>{bevestigd ? definitiefBevestigLabel : bevestigLabel}</span>
          }
        />
        <DefaultButton text="Annuleren" onClick={onAnnuleer} disabled={isBezig} />
      </DialogFooter>
    </Dialog>
  );
};

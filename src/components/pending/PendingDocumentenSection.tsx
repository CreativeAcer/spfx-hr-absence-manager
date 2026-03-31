// ============================================================
// components/pending/PendingDocumentenSection.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import {
  Stack, Text, ActionButton, PrimaryButton, DefaultButton,
  Dialog, DialogType, DialogFooter, Spinner, SpinnerSize,
  Icon, TooltipHost,
} from '@fluentui/react';
import { IZiektebriefDocument } from '../../models';
import { formatDatum } from '../../utils/dateUtils';
import { AanmaakAfwezigheidModal } from '../modals/AanmaakAfwezigheidModal';
import styles from './PendingDocumentenSection.module.scss';

interface IPendingDocumentenSectionProps {
  documenten: IZiektebriefDocument[];
  isBezig: boolean;
  onAanmaken: (doc: IZiektebriefDocument, begindatum: Date, einddatum: Date) => Promise<void>;
  onNegeren: (id: number) => Promise<void>;
}

export const PendingDocumentenSection: React.FC<IPendingDocumentenSectionProps> = ({
  documenten, isBezig, onAanmaken, onNegeren,
}) => {
  const [ingeklapt, setIngeklapt] = useState(false);
  const [geselecteerdDoc, setGeselecteerdDoc] = useState<IZiektebriefDocument | undefined>(undefined);
  const [negeerDocId, setNegeerDocId] = useState<number | undefined>(undefined);
  const [bezigeRij, setBezigeRij] = useState<number | undefined>(undefined);

  if (documenten.length === 0) return null;

  const handleAanmaken = async (begindatum: Date, einddatum: Date): Promise<void> => {
    if (!geselecteerdDoc) return;
    const docId = geselecteerdDoc.id;
    setGeselecteerdDoc(undefined);
    setBezigeRij(docId);
    try {
      await onAanmaken(geselecteerdDoc, begindatum, einddatum);
    } finally {
      setBezigeRij(undefined);
    }
  };

  const handleNegeren = async (): Promise<void> => {
    if (negeerDocId === undefined) return;
    const docId = negeerDocId;
    setNegeerDocId(undefined);
    setBezigeRij(docId);
    try {
      await onNegeren(docId);
    } finally {
      setBezigeRij(undefined);
    }
  };

  return (
    <Stack className={styles.container} tokens={{ childrenGap: 8 }}>
      {/* Header */}
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Icon iconName="Warning" className={styles.waarschuwingIcoon} />
          <Text variant="mediumPlus" className={styles.koptekst}>
            Nieuwe ziektebriefjes zonder dossier ({documenten.length})
          </Text>
        </Stack>
        <ActionButton
          iconProps={{ iconName: ingeklapt ? 'ChevronDown' : 'ChevronUp' }}
          text={ingeklapt ? 'Tonen' : 'Verbergen'}
          onClick={() => setIngeklapt(!ingeklapt)}
          className={styles.toggleKnop}
        />
      </Stack>

      {!ingeklapt && (
        <Stack tokens={{ childrenGap: 0 }} role="table" aria-label="Ongekoppelde ziektebriefjes">
          {/* Column headers */}
          <Stack horizontal className={styles.kolomHoofden} role="row">
            <Text variant="small" className={`${styles.cel} ${styles.celGroot} ${styles.kolomHoofd}`} role="columnheader">Bestand</Text>
            <Text variant="small" className={`${styles.cel} ${styles.celMiddel} ${styles.kolomHoofd}`} role="columnheader">Medewerker</Text>
            <Text variant="small" className={`${styles.cel} ${styles.celMiddel} ${styles.kolomHoofd}`} role="columnheader">Periode</Text>
            <Text variant="small" className={`${styles.cel} ${styles.celMiddel} ${styles.kolomHoofd}`} role="columnheader">Acties</Text>
          </Stack>

          {documenten.map((doc, idx) => {
            const heeftPersoon = !!doc.persoon;
            const rowBezig = bezigeRij === doc.id;

            return (
              <Stack
                key={doc.id}
                horizontal
                verticalAlign="center"
                className={`${styles.rij} ${idx % 2 === 0 ? styles.rijPaar : styles.rijOnpaar}`}
                role="row"
              >
                {/* Bestandsnaam */}
                <Stack className={`${styles.cel} ${styles.celGroot}`} role="cell">
                  <a
                    href={doc.serverRelativeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.documentLink}
                  >
                    <Icon iconName="PDF" className={styles.pdfIcoon} />
                    {doc.fileName}
                  </a>
                </Stack>

                {/* Medewerker */}
                <Stack className={`${styles.cel} ${styles.celMiddel}`} role="cell">
                  {heeftPersoon ? (
                    <Text variant="small" className={styles.persoonNaam}>
                      {doc.persoon!.displayName}
                    </Text>
                  ) : (
                    <Text variant="small" className={styles.geenPersoon}>
                      Niet ingevuld
                    </Text>
                  )}
                </Stack>

                {/* Periode */}
                <Stack className={`${styles.cel} ${styles.celMiddel}`} role="cell">
                  <Text variant="small">
                    {doc.aanvangsDatum ? formatDatum(doc.aanvangsDatum) : '—'} &ndash; {doc.eindDatum ? formatDatum(doc.eindDatum) : '—'}
                  </Text>
                </Stack>

                {/* Acties */}
                <Stack horizontal className={`${styles.cel} ${styles.celMiddel}`} tokens={{ childrenGap: 6 }} role="cell">
                  {rowBezig ? (
                    <Spinner size={SpinnerSize.small} />
                  ) : (
                    <>
                      <TooltipHost
                        content={!heeftPersoon ? 'Vul eerst een Persoon in op het document in SharePoint' : undefined}
                      >
                        <PrimaryButton
                          text="Aanmaken"
                          iconProps={{ iconName: 'Add' }}
                          onClick={() => setGeselecteerdDoc(doc)}
                          disabled={!heeftPersoon || isBezig}
                          styles={{ root: { minWidth: 'auto', padding: '0 10px', height: 28 } }}
                        />
                      </TooltipHost>
                      <DefaultButton
                        text="Negeren"
                        iconProps={{ iconName: 'Cancel' }}
                        onClick={() => setNegeerDocId(doc.id)}
                        disabled={isBezig}
                        styles={{ root: { minWidth: 'auto', padding: '0 10px', height: 28 } }}
                      />
                    </>
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}

      {/* Aanmaken modal */}
      {geselecteerdDoc && (
        <AanmaakAfwezigheidModal
          document={geselecteerdDoc}
          isOpen={true}
          isBezig={isBezig}
          onBevestig={handleAanmaken}
          onAnnuleer={() => setGeselecteerdDoc(undefined)}
        />
      )}

      {/* Negeren bevestiging */}
      <Dialog
        hidden={negeerDocId === undefined}
        onDismiss={() => setNegeerDocId(undefined)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Ziektebriefje negeren',
          subText: 'Dit document wordt als "Genegeerd" gemarkeerd en verdwijnt uit de lijst. Wil je doorgaan?',
        }}
      >
        <DialogFooter>
          <DefaultButton text="Annuleren" onClick={() => setNegeerDocId(undefined)} />
          <PrimaryButton text="Ja, negeren" onClick={() => { handleNegeren().catch(console.error); }} />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};

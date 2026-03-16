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
import { AanmaakAfwezigheidModal } from '../modals/AanmaakAfwezigheidModal';

interface IPendingDocumentenSectionProps {
  documenten: IZiektebriefDocument[];
  isBezig: boolean;
  onAanmaken: (doc: IZiektebriefDocument, begindatum: Date, einddatum: Date) => Promise<void>;
  onNegeren: (id: number) => Promise<void>;
}

function formatDatum(d: Date | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    setBezigeRij(geselecteerdDoc.id);
    setGeselecteerdDoc(undefined);
    await onAanmaken(geselecteerdDoc, begindatum, einddatum);
    setBezigeRij(undefined);
  };

  const handleNegeren = async (): Promise<void> => {
    if (negeerDocId === undefined) return;
    setBezigeRij(negeerDocId);
    setNegeerDocId(undefined);
    await onNegeren(negeerDocId);
    setBezigeRij(undefined);
  };

  return (
    <Stack
      styles={{
        root: {
          background: '#fff8e1',
          border: '1px solid #f0c030',
          borderRadius: 4,
          padding: '12px 16px',
        },
      }}
      tokens={{ childrenGap: 8 }}
    >
      {/* Header */}
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Icon iconName="Warning" styles={{ root: { color: '#c0880c', fontSize: 16 } }} />
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, color: '#7a5700' } }}>
            Nieuwe ziektebriefjes zonder dossier ({documenten.length})
          </Text>
        </Stack>
        <ActionButton
          iconProps={{ iconName: ingeklapt ? 'ChevronDown' : 'ChevronUp' }}
          text={ingeklapt ? 'Tonen' : 'Verbergen'}
          onClick={() => setIngeklapt(!ingeklapt)}
          styles={{ root: { color: '#7a5700' } }}
        />
      </Stack>

      {!ingeklapt && (
        <Stack tokens={{ childrenGap: 0 }}>
          {/* Kolomhoofden */}
          <Stack
            horizontal
            styles={{
              root: {
                background: '#f7e79a',
                padding: '6px 8px',
                borderRadius: '2px 2px 0 0',
                borderBottom: '1px solid #e0c040',
              },
            }}
          >
            <Text variant="small" styles={{ root: { fontWeight: 600, flex: 3, color: '#7a5700' } }}>Bestand</Text>
            <Text variant="small" styles={{ root: { fontWeight: 600, flex: 2, color: '#7a5700' } }}>Medewerker</Text>
            <Text variant="small" styles={{ root: { fontWeight: 600, flex: 2, color: '#7a5700' } }}>Periode</Text>
            <Text variant="small" styles={{ root: { fontWeight: 600, flex: 2, color: '#7a5700' } }}>Acties</Text>
          </Stack>

          {documenten.map((doc, idx) => {
            const heeftPersoon = !!doc.persoon;
            const rowBezig = bezigeRij === doc.id || (isBezig && bezigeRij === doc.id);

            return (
              <Stack
                key={doc.id}
                horizontal
                verticalAlign="center"
                styles={{
                  root: {
                    padding: '8px',
                    background: idx % 2 === 0 ? '#fffdf0' : '#fef9d0',
                    borderBottom: '1px solid #e8e0b0',
                  },
                }}
              >
                {/* Bestandsnaam */}
                <Stack styles={{ root: { flex: 3 } }}>
                  <a
                    href={doc.serverRelativeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0078d4', textDecoration: 'none', fontSize: 13 }}
                  >
                    <Icon iconName="PDF" styles={{ root: { marginRight: 4, fontSize: 12 } }} />
                    {doc.fileName}
                  </a>
                </Stack>

                {/* Medewerker */}
                <Stack styles={{ root: { flex: 2 } }}>
                  {heeftPersoon ? (
                    <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                      {doc.persoon!.displayName}
                    </Text>
                  ) : (
                    <Text variant="small" styles={{ root: { color: '#a4262c', fontStyle: 'italic' } }}>
                      Niet ingevuld
                    </Text>
                  )}
                </Stack>

                {/* Periode */}
                <Stack styles={{ root: { flex: 2 } }}>
                  <Text variant="small">
                    {formatDatum(doc.aanvangsDatum)} – {formatDatum(doc.eindDatum)}
                  </Text>
                </Stack>

                {/* Acties */}
                <Stack horizontal styles={{ root: { flex: 2 } }} tokens={{ childrenGap: 6 }}>
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

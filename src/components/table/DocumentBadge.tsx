// ============================================================
// components/table/DocumentBadge.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import { ActionButton, TooltipHost, Spinner, SpinnerSize, Text, Stack } from '@fluentui/react';
import { IZiektebriefDocument } from '../../models';
import { documentService } from '../../services/DocumentService';

interface IDocumentBadgeProps {
  afwezigheidId: number;
}

export const DocumentBadge: React.FC<IDocumentBadgeProps> = ({ afwezigheidId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documenten, setDocumenten] = useState<IZiektebriefDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fout, setFout] = useState<string | undefined>(undefined);
  const [heeftGeladen, setHeeftGeladen] = useState(false);

  const laadDocumenten = async (): Promise<void> => {
    if (isExpanded) { setIsExpanded(false); return; }
    setIsExpanded(true);
    if (heeftGeladen) return; // serve cached data
    setIsLoading(true);
    setFout(undefined);
    try {
      const docs = await documentService.getDocumentenVoorAfwezigheid(afwezigheidId);
      setDocumenten(docs);
      setHeeftGeladen(true);
    } catch {
      setFout('Kon documenten niet laden');
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner size={SpinnerSize.xSmall} />;

  if (fout) {
    return <Text variant="small" styles={{ root: { color: '#a4262c' } }}>{fout}</Text>;
  }

  if (isExpanded && documenten.length > 0) {
    return (
      <Stack tokens={{ childrenGap: 2 }}>
        {documenten.map((doc) => (
          <ActionButton
            key={doc.id}
            iconProps={{ iconName: 'PDF' }}
            href={doc.serverRelativeUrl}
            target="_blank"
            text={doc.fileName}
          />
        ))}
        <ActionButton iconProps={{ iconName: 'ChevronUp' }} text="Verbergen" onClick={() => setIsExpanded(false)} />
      </Stack>
    );
  }

  if (isExpanded && documenten.length === 0 && heeftGeladen) {
    return (
      <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>Geen documenten</Text>
        <ActionButton iconProps={{ iconName: 'ChevronUp' }} onClick={() => setIsExpanded(false)} />
      </Stack>
    );
  }

  return (
    <TooltipHost content="Documenten bekijken">
      <ActionButton
        iconProps={{ iconName: 'Document' }}
        text="Docs"
        onClick={() => { laadDocumenten().catch(console.error); }}
      />
    </TooltipHost>
  );
};

// ============================================================
// components/table/DocumentBadge.tsx
// ============================================================
import * as React from 'react';
import { useState } from 'react';
import { ActionButton, TooltipHost, Spinner, SpinnerSize } from '@fluentui/react';
import { IZiektebriefDocument } from '../../models';
import { documentService } from '../../services/DocumentService';

interface IDocumentBadgeProps {
  documentLink?: string;
  afwezigheidId: number;
}

export const DocumentBadge: React.FC<IDocumentBadgeProps> = ({ afwezigheidId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documenten, setDocumenten] = useState<IZiektebriefDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const laadDocumenten = async (): Promise<void> => {
    if (isExpanded) { setIsExpanded(false); return; }
    setIsLoading(true);
    try {
      const docs = await documentService.getDocumentenVoorAfwezigheid(afwezigheidId);
      setDocumenten(docs);
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner size={SpinnerSize.xSmall} />;

  if (isExpanded && documenten.length > 0) {
    return (
      <div>
        {documenten.map((doc) => (
          <div key={doc.id}>
            <ActionButton
              iconProps={{ iconName: 'PDF' }}
              href={doc.serverRelativeUrl}
              target="_blank"
              text={doc.fileName}
            />
          </div>
        ))}
        <ActionButton iconProps={{ iconName: 'ChevronUp' }} text="Verbergen" onClick={() => setIsExpanded(false)} />
      </div>
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

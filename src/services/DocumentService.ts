// ============================================================
// services/DocumentService.ts
// ============================================================
import { getSP, LIBRARY_NAMES } from '../config/pnpjsConfig';
import { IZiektebriefDocument, AfwezigheidStatus } from '../models';

const SELECT_FIELDS = [
  'Id', 'Title', 'AfwezigheidID', 'Status',
  'DocumentDatum', 'AanvangsDatum', 'EindDatum', 'Opmerkingen',
  'FileRef', 'FileLeafRef',
  'Persoon/Id', 'Persoon/Title', 'Persoon/EMail',
];

function mapItem(item: Record<string, unknown>): IZiektebriefDocument {
  return {
    id: item.Id as number,
    title: item.Title as string,
    persoon: item.Persoon
      ? {
          id: (item.Persoon as Record<string, unknown>).Id as number,
          displayName: (item.Persoon as Record<string, unknown>).Title as string,
          email: (item.Persoon as Record<string, unknown>).EMail as string | undefined,
        }
      : undefined,
    afwezigheidID: item.AfwezigheidID as number | undefined,
    status: item.Status as AfwezigheidStatus,
    documentDatum: item.DocumentDatum ? new Date(item.DocumentDatum as string) : undefined,
    aanvangsDatum: item.AanvangsDatum ? new Date(item.AanvangsDatum as string) : undefined,
    eindDatum: item.EindDatum ? new Date(item.EindDatum as string) : undefined,
    opmerkingen: item.Opmerkingen as string | undefined,
    serverRelativeUrl: item.FileRef as string,
    fileName: item.FileLeafRef as string,
  };
}

export class DocumentService {
  public async getDocumentenVoorAfwezigheid(afwezigheidId: number): Promise<IZiektebriefDocument[]> {
    const items = await getSP().web.lists
      .getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES)
      .items.select(...SELECT_FIELDS)
      .expand('Persoon')
      .filter(`FSObjType eq 0 and AfwezigheidID eq ${afwezigheidId}`)();

    return items.map((item: Record<string, unknown>) => mapItem(item));
  }

  public async getOngekoepeldeDocumenten(): Promise<IZiektebriefDocument[]> {
    const items = await getSP().web.lists
      .getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES)
      .items.select(...SELECT_FIELDS)
      .expand('Persoon')
      .filter(`FSObjType eq 0 and (AfwezigheidID eq 0 or AfwezigheidID eq null) and Status ne 'Genegeerd'`)
      .orderBy('Created', false)
      .top(100)();

    return items.map((item: Record<string, unknown>) => mapItem(item));
  }

  public async negeerDocument(id: number): Promise<void> {
    await getSP().web.lists
      .getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES)
      .items.getById(id)
      .update({ Status: 'Genegeerd' });
  }

  public async updateDocumentMetadata(
    documentId: number,
    nieuweStatus: AfwezigheidStatus,
    nieuweEinddatum?: Date
  ): Promise<void> {
    const payload: Record<string, unknown> = { Status: nieuweStatus };
    if (nieuweEinddatum) payload.EindDatum = nieuweEinddatum.toISOString();

    await getSP().web.lists
      .getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES)
      .items.getById(documentId)
      .update(payload);
  }
}

export const documentService = new DocumentService();

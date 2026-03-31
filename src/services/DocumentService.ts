// ============================================================
// services/DocumentService.ts
// ============================================================
import { getSP, LIBRARY_NAMES } from '../config/pnpjsConfig';
import { IZiektebriefDocument, AfwezigheidStatus } from '../models';
import { SP_QUERY_LIMITS } from '../constants';

/** Typed shape of a raw SharePoint item from the Ziektebriefjes library. */
interface IZiektebriefSpItem {
  Id: number;
  Title: string;
  AfwezigheidID?: number;
  Status: AfwezigheidStatus;
  DocumentDatum?: string;
  AanvangsDatum?: string;
  EindDatum?: string;
  Opmerkingen?: string;
  FileRef: string;
  FileLeafRef: string;
  Persoon?: { Id: number; Title: string; EMail?: string };
}

const SELECT_FIELDS = [
  'Id', 'Title', 'AfwezigheidID', 'Status',
  'DocumentDatum', 'AanvangsDatum', 'EindDatum', 'Opmerkingen',
  'FileRef', 'FileLeafRef',
  'Persoon/Id', 'Persoon/Title', 'Persoon/EMail',
];

function mapItem(item: IZiektebriefSpItem): IZiektebriefDocument {
  return {
    id: item.Id,
    title: item.Title,
    persoon: item.Persoon
      ? {
          id: item.Persoon.Id,
          displayName: item.Persoon.Title,
          email: item.Persoon.EMail,
        }
      : undefined,
    afwezigheidID: item.AfwezigheidID,
    status: item.Status,
    documentDatum: item.DocumentDatum ? new Date(item.DocumentDatum) : undefined,
    aanvangsDatum: item.AanvangsDatum ? new Date(item.AanvangsDatum) : undefined,
    eindDatum: item.EindDatum ? new Date(item.EindDatum) : undefined,
    opmerkingen: item.Opmerkingen,
    serverRelativeUrl: item.FileRef,
    fileName: item.FileLeafRef,
  };
}

export class DocumentService {
  public async getDocumentenVoorAfwezigheid(afwezigheidId: number): Promise<IZiektebriefDocument[]> {
    const items = await getSP().web.lists
      .getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES)
      .items.select(...SELECT_FIELDS)
      .expand('Persoon')
      .filter(`FSObjType eq 0 and AfwezigheidID eq ${afwezigheidId}`)();

    return (items as IZiektebriefSpItem[]).map(mapItem);
  }

  public async getOngekoepeldeDocumenten(): Promise<IZiektebriefDocument[]> {
    const items = await getSP().web.lists
      .getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES)
      .items.select(...SELECT_FIELDS)
      .expand('Persoon')
      .filter(`FSObjType eq 0 and (AfwezigheidID eq 0 or AfwezigheidID eq null) and Status ne 'Genegeerd'`)
      .orderBy('Created', false)
      .top(SP_QUERY_LIMITS.DOCUMENTEN)();

    return (items as IZiektebriefSpItem[]).map(mapItem);
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

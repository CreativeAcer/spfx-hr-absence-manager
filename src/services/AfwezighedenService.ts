// ============================================================
// services/AfwezighedenService.ts
// ============================================================
import { getSP, LIST_NAMES, LIBRARY_NAMES } from '../config/pnpjsConfig';
import {
  IAfwezigheid,
  AfwezigheidStatus,
  IVerlengFormData,
  ITeRugActiefFormData,
  IKpiData,
  IZiektebriefDocument,
} from '../models';

interface IAfwezigheidSpItem {
  Id: number;
  Title: string;
  Persoon: { Id: number; Title: string; EMail?: string };
  PersoonEmail: string;
  Afdeling?: string;
  Begindatum: string;
  Einddatum: string;
  OrigineelEinde?: string;
  Status: AfwezigheidStatus;
  DocumentLink?: { Url: string };
  DocumentID?: number;
  AantalVerlengingen: number;
  RedenAfwezigheid?: string;
  AangepastDoor?: { Id: number; Title: string; EMail?: string };
  AangepastOp?: string;
  HRNota?: string;
}

const WAARSCHUWING_DAGEN = 7;

function mapItem(item: IAfwezigheidSpItem): IAfwezigheid {
  const einddatum = new Date(item.Einddatum);
  const vandaag = new Date();
  const dagenTotEinde = Math.ceil(
    (einddatum.getTime() - vandaag.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: item.Id,
    title: item.Title,
    persoon: {
      id: item.Persoon?.Id ?? 0,
      displayName: item.Persoon?.Title ?? item.Title,
      email: item.Persoon?.EMail,
    },
    persoonEmail: item.PersoonEmail ?? item.Persoon?.EMail ?? '',
    afdeling: item.Afdeling,
    begindatum: new Date(item.Begindatum),
    einddatum,
    origineelEinde: item.OrigineelEinde ? new Date(item.OrigineelEinde) : undefined,
    status: item.Status,
    documentLink: item.DocumentLink?.Url,
    documentID: item.DocumentID,
    aantalVerlengingen: item.AantalVerlengingen ?? 0,
    redenAfwezigheid: item.RedenAfwezigheid as IAfwezigheid['redenAfwezigheid'],
    aangepastDoor: item.AangepastDoor
      ? { id: item.AangepastDoor.Id, displayName: item.AangepastDoor.Title, email: item.AangepastDoor.EMail }
      : undefined,
    aangepastOp: item.AangepastOp ? new Date(item.AangepastOp) : undefined,
    hrNota: item.HRNota,
    dagenTotEinde,
    isVerlopend: dagenTotEinde <= WAARSCHUWING_DAGEN && dagenTotEinde > 0,
  };
}

export class AfwezighedenService {
  public async getActieveAfwezigheden(): Promise<IAfwezigheid[]> {
    const sp = getSP();
    const items = await sp.web.lists
      .getByTitle(LIST_NAMES.AFWEZIGHEDEN)
      .items.select(
        'Id', 'Title',
        'Persoon/Id', 'Persoon/Title', 'Persoon/EMail',
        'PersoonEmail', 'Afdeling', 'Begindatum', 'Einddatum', 'OrigineelEinde',
        'Status', 'DocumentLink', 'DocumentID', 'AantalVerlengingen',
        'RedenAfwezigheid',
        'AangepastDoor/Id', 'AangepastDoor/Title', 'AangepastDoor/EMail',
        'AangepastOp', 'HRNota'
      )
      .expand('Persoon', 'AangepastDoor')
      .filter(`Status ne 'Gearchiveerd'`)
      .orderBy('Begindatum', false)
      .top(500)();

    return (items as IAfwezigheidSpItem[]).map(mapItem);
  }

  public async verlengAfwezigheid(
    id: number,
    formData: IVerlengFormData,
    huidigItem: IAfwezigheid
  ): Promise<void> {
    const sp = getSP();
    const payload: Record<string, unknown> = {
      Einddatum: formData.nieuweEinddatum.toISOString(),
      Status: 'Verlengd' as AfwezigheidStatus,
      AantalVerlengingen: (huidigItem.aantalVerlengingen ?? 0) + 1,
      AangepastOp: new Date().toISOString(),
    };
    if (!huidigItem.origineelEinde) {
      payload.OrigineelEinde = huidigItem.einddatum.toISOString();
    }
    if (formData.hrNota) payload.HRNota = formData.hrNota;

    await sp.web.lists.getByTitle(LIST_NAMES.AFWEZIGHEDEN).items.getById(id).update(payload);
  }

  public async zetTeRugActief(id: number, formData: ITeRugActiefFormData): Promise<void> {
    const sp = getSP();
    const payload: Record<string, unknown> = {
      Einddatum: formData.definitieveEinddatum.toISOString(),
      Status: 'Actief' as AfwezigheidStatus,
      AangepastOp: new Date().toISOString(),
    };
    if (formData.hrNota) payload.HRNota = formData.hrNota;

    await sp.web.lists.getByTitle(LIST_NAMES.AFWEZIGHEDEN).items.getById(id).update(payload);
  }

  public async maakAfwezigheidVanDocument(
    doc: IZiektebriefDocument,
    begindatum: Date,
    einddatum: Date
  ): Promise<number> {
    const sp = getSP();

    const result = await sp.web.lists.getByTitle(LIST_NAMES.AFWEZIGHEDEN).items.add({
      Title: doc.persoon?.displayName ?? 'Onbekend',
      PersoonId: doc.persoon?.id,
      PersoonEmail: doc.persoon?.email ?? '',
      Begindatum: begindatum.toISOString(),
      Einddatum: einddatum.toISOString(),
      Status: 'Ziekteverlof' as AfwezigheidStatus,
      DocumentID: doc.id,
      AantalVerlengingen: 0,
    });

    const afwezigheidId = (result as Record<string, unknown>).Id as number;

    await sp.web.lists.getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES).items.getById(doc.id).update({
      AfwezigheidID: afwezigheidId,
      Status: 'Ziekteverlof' as AfwezigheidStatus,
    });

    return afwezigheidId;
  }

  public berekenKpis(afwezigheden: IAfwezigheid[]): IKpiData {
    const vandaag = new Date();
    const volgendeWeek = new Date(vandaag.getTime() + 7 * 24 * 60 * 60 * 1000);
    const actief = afwezigheden.filter((a) => a.status === 'Ziekteverlof' || a.status === 'Verlengd');

    const verlopendDezeWeek = actief.filter(
      (a) => a.einddatum <= volgendeWeek && a.einddatum >= vandaag
    ).length;

    const verlengdVandaag = afwezigheden.filter((a) => {
      if (!a.aangepastOp || a.status !== 'Verlengd') return false;
      return new Date(a.aangepastOp).toDateString() === vandaag.toDateString();
    }).length;

    const duuren = actief
      .map((a) => Math.ceil((a.einddatum.getTime() - a.begindatum.getTime()) / (1000 * 60 * 60 * 24)))
      .filter((d) => d > 0);

    return {
      totaalActief: actief.length,
      verlopendDezeWeek,
      verlengdVandaag,
      gemiddeldeDuurDagen: duuren.length > 0
        ? Math.round(duuren.reduce((s, d) => s + d, 0) / duuren.length)
        : 0,
    };
  }
}

export const afwezighedenService = new AfwezighedenService();

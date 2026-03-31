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
import { SP_QUERY_LIMITS, DREMPEL_DAGEN } from '../constants';
import { berekenDagenVerschil, MS_PER_DAY } from '../utils/dateUtils';

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

function mapItem(item: IAfwezigheidSpItem, waarschuwingsDagen: number): IAfwezigheid {
  const einddatum = new Date(item.Einddatum);
  const vandaag = new Date();
  const dagenTotEinde = berekenDagenVerschil(vandaag, einddatum);

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
    isVerlopend: dagenTotEinde <= waarschuwingsDagen && dagenTotEinde > 0,
  };
}

export class AfwezighedenService {
  public async getActieveAfwezigheden(waarschuwingsDagen = DREMPEL_DAGEN.WAARSCHUWING): Promise<IAfwezigheid[]> {
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
      .getAll(SP_QUERY_LIMITS.AFWEZIGHEDEN);

    return (items as IAfwezigheidSpItem[]).map((item) => mapItem(item, waarschuwingsDagen));
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

    const afwezigheidId = result.Id;

    await sp.web.lists.getByTitle(LIBRARY_NAMES.ZIEKTEBRIEFJES).items.getById(doc.id).update({
      AfwezigheidID: afwezigheidId,
      Status: 'Ziekteverlof' as AfwezigheidStatus,
    });

    return afwezigheidId;
  }

  public berekenKpis(afwezigheden: IAfwezigheid[], waarschuwingsDagen = DREMPEL_DAGEN.WAARSCHUWING): IKpiData {
    const vandaag = new Date();
    const volgendeWeek = new Date(vandaag.getTime() + waarschuwingsDagen * MS_PER_DAY);
    const actief = afwezigheden.filter((a) => a.status === 'Ziekteverlof' || a.status === 'Verlengd');

    const verlopendDezeWeek = actief.filter(
      (a) => a.einddatum <= volgendeWeek && a.einddatum >= vandaag
    ).length;

    const verlengdVandaag = afwezigheden.filter((a) => {
      if (!a.aangepastOp || a.status !== 'Verlengd') return false;
      return new Date(a.aangepastOp).toDateString() === vandaag.toDateString();
    }).length;

    const duuren = actief
      .map((a) => berekenDagenVerschil(a.begindatum, a.einddatum))
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

// ============================================================
// services/AuditService.ts
// ============================================================
import { getSP, LIST_NAMES } from '../config/pnpjsConfig';
import { IAuditEntry, AuditActie, IAfwezigheid } from '../models';
import { SP_QUERY_LIMITS } from '../constants';

export class AuditService {
  public async logActie(params: {
    afwezigheidId: number;
    actie: AuditActie;
    persoonNaam: string;
    oudeWaarde?: Partial<IAfwezigheid>;
    nieuweWaarde?: Partial<IAfwezigheid>;
    opmerking?: string;
  }): Promise<void> {
    const sp = getSP();
    await sp.web.lists.getByTitle(LIST_NAMES.AUDIT_LOG).items.add({
      Title: `${params.actie} - ${params.persoonNaam}`,
      AfwezigheidID: params.afwezigheidId,
      Actie: params.actie,
      Tijdstip: new Date().toISOString(),
      OudeWaarde: params.oudeWaarde ? JSON.stringify(params.oudeWaarde) : undefined,
      NieuweWaarde: params.nieuweWaarde ? JSON.stringify(params.nieuweWaarde) : undefined,
      Opmerking: params.opmerking,
    });
  }

  public async getAuditLogVoorAfwezigheid(afwezigheidId: number): Promise<IAuditEntry[]> {
    const sp = getSP();
    const items = await sp.web.lists
      .getByTitle(LIST_NAMES.AUDIT_LOG)
      .items.select(
        'Id', 'Title', 'AfwezigheidID', 'Actie', 'Tijdstip',
        'OudeWaarde', 'NieuweWaarde', 'Opmerking',
        'Author/Id', 'Author/Title', 'Author/EMail'
      )
      .expand('Author')
      .filter(`AfwezigheidID eq ${afwezigheidId}`)
      .orderBy('Tijdstip', false)
      .top(SP_QUERY_LIMITS.AUDIT_LOG)();

    return items.map((item: Record<string, unknown>) => ({
      id: item.Id as number,
      title: item.Title as string,
      afwezigheidID: item.AfwezigheidID as number,
      actie: item.Actie as AuditActie,
      gewijzigdDoor: {
        id: (item.Author as Record<string, unknown>)?.Id as number ?? 0,
        displayName: (item.Author as Record<string, unknown>)?.Title as string ?? 'Onbekend',
        email: (item.Author as Record<string, unknown>)?.EMail as string | undefined,
      },
      tijdstip: new Date(item.Tijdstip as string),
      oudeWaarde: item.OudeWaarde as string | undefined,
      nieuweWaarde: item.NieuweWaarde as string | undefined,
      opmerking: item.Opmerking as string | undefined,
    }));
  }
}

export const auditService = new AuditService();

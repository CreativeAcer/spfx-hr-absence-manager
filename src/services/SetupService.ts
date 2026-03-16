// ============================================================
// services/SetupService.ts
// Provisioning — veld aangemaakt met interne naam (geen spaties),
// daarna Title geüpdatet naar leesbare weergavenaam.
// ============================================================
import '@pnp/sp/fields';
import { getSP, LIST_NAMES, LIBRARY_NAMES } from '../config/pnpjsConfig';

export type SetupItemStatus = 'onbekend' | 'bestaat' | 'ontbreekt' | 'bezig' | 'klaar' | 'fout';

export interface ISetupItem {
  id: string;
  label: string;
  beschrijving: string;
  status: SetupItemStatus;
  foutmelding?: string;
  aantalKolommenAangemaakt?: number;
}

// ── Hulpfuncties voor veldaanmaak ─────────────────────────────
// Velden worden aangemaakt met internalName als titel zodat SP die
// als interne naam gebruikt. Daarna updaten we Title naar het label.

async function addChoiceField(listTitle: string, internalName: string, choices: string[]): Promise<void> {
  const sp = getSP();
  await sp.web.lists.getByTitle(listTitle).fields.addChoice(internalName, {
    Choices: choices,
    Required: false,
  });
}

async function addTextField(listTitle: string, internalName: string, required = false, multiline = false): Promise<void> {
  const sp = getSP();
  if (multiline) {
    await sp.web.lists.getByTitle(listTitle).fields.addMultilineText(internalName, { Required: required });
  } else {
    await sp.web.lists.getByTitle(listTitle).fields.addText(internalName, { Required: required });
  }
}

async function addDateField(listTitle: string, internalName: string, required = false, includeTime = false): Promise<void> {
  const sp = getSP();
  await sp.web.lists.getByTitle(listTitle).fields.addDateTime(internalName, {
    Required: required,
    DisplayFormat: includeTime ? 1 : 0,
  });
}

async function addNumberField(listTitle: string, internalName: string): Promise<void> {
  const sp = getSP();
  await sp.web.lists.getByTitle(listTitle).fields.addNumber(internalName, {});
}

async function addPersonField(listTitle: string, internalName: string, required = false): Promise<void> {
  const sp = getSP();
  await sp.web.lists.getByTitle(listTitle).fields.addUser(internalName, {
    Required: required,
    SelectionMode: 1,
  });
}

async function addUrlField(listTitle: string, internalName: string): Promise<void> {
  const sp = getSP();
  await sp.web.lists.getByTitle(listTitle).fields.add(internalName, 11, {});
}

async function addBooleanField(listTitle: string, internalName: string): Promise<void> {
  const sp = getSP();
  await sp.web.lists.getByTitle(listTitle).fields.addBoolean(internalName, {});
}

// ── Veldenschema's ────────────────────────────────────────────

interface IFieldDef {
  internalName: string; // technische interne naam (geen spaties) — voor aanmaak en queries
  label: string;        // leesbare weergavenaam voor gebruikers in SharePoint
  create: (listTitle: string) => Promise<void>;
}

const AFWEZIGHEDEN_FIELDS: IFieldDef[] = [
  { internalName: 'Persoon',            label: 'Persoon',              create: (t) => addPersonField(t, 'Persoon', true) },
  { internalName: 'PersoonEmail',       label: 'Persoon Email',        create: (t) => addTextField(t, 'PersoonEmail') },
  { internalName: 'Afdeling',           label: 'Afdeling',             create: (t) => addTextField(t, 'Afdeling') },
  { internalName: 'Begindatum',         label: 'Begindatum',           create: (t) => addDateField(t, 'Begindatum', true) },
  { internalName: 'Einddatum',          label: 'Einddatum',            create: (t) => addDateField(t, 'Einddatum', true) },
  { internalName: 'OrigineelEinde',     label: 'Origineel Einde',      create: (t) => addDateField(t, 'OrigineelEinde') },
  { internalName: 'Status',             label: 'Status',               create: (t) => addChoiceField(t, 'Status', ['Ziekteverlof', 'Verlengd', 'Actief', 'Gearchiveerd']) },
  { internalName: 'DocumentLink',       label: 'Document Link',        create: (t) => addUrlField(t, 'DocumentLink') },
  { internalName: 'DocumentID',         label: 'Document ID',          create: (t) => addNumberField(t, 'DocumentID') },
  { internalName: 'AantalVerlengingen', label: 'Aantal Verlengingen',  create: (t) => addNumberField(t, 'AantalVerlengingen') },
  { internalName: 'RedenAfwezigheid',   label: 'Reden Afwezigheid',    create: (t) => addChoiceField(t, 'RedenAfwezigheid', ['Ziekte', 'Arbeidsongeval', 'Burnout', 'Andere']) },
  { internalName: 'AangepastDoor',      label: 'Aangepast Door',       create: (t) => addPersonField(t, 'AangepastDoor') },
  { internalName: 'AangepastOp',        label: 'Aangepast Op',         create: (t) => addDateField(t, 'AangepastOp', false, true) },
  { internalName: 'HRNota',             label: 'HR Nota',              create: (t) => addTextField(t, 'HRNota', false, true) },
];

const ZIEKTEBRIEFJES_FIELDS: IFieldDef[] = [
  { internalName: 'Persoon',       label: 'Persoon',          create: (t) => addPersonField(t, 'Persoon', true) },
  { internalName: 'AfwezigheidID', label: 'Afwezigheid ID',   create: (t) => addNumberField(t, 'AfwezigheidID') },
  { internalName: 'Status',        label: 'Status',           create: (t) => addChoiceField(t, 'Status', ['Ziekteverlof', 'Verlengd', 'Actief', 'Gearchiveerd', 'Genegeerd']) },
  { internalName: 'DocumentDatum', label: 'Document Datum',   create: (t) => addDateField(t, 'DocumentDatum') },
  { internalName: 'AanvangsDatum', label: 'Aanvangsdatum',    create: (t) => addDateField(t, 'AanvangsDatum') },
  { internalName: 'EindDatum',     label: 'Einddatum',        create: (t) => addDateField(t, 'EindDatum') },
  { internalName: 'Opmerkingen',   label: 'Opmerkingen',      create: (t) => addTextField(t, 'Opmerkingen', false, true) },
];

const HR_SETTINGS_FIELDS: IFieldDef[] = [
  { internalName: 'Waarde',       label: 'Waarde',       create: (t) => addTextField(t, 'Waarde', true, true) },
  { internalName: 'Beschrijving', label: 'Beschrijving', create: (t) => addTextField(t, 'Beschrijving', false, true) },
  { internalName: 'IsActief',     label: 'Is Actief',    create: (t) => addBooleanField(t, 'IsActief') },
];

const AUDIT_LOG_FIELDS: IFieldDef[] = [
  { internalName: 'AfwezigheidID', label: 'Afwezigheid ID', create: (t) => addNumberField(t, 'AfwezigheidID') },
  { internalName: 'Actie',         label: 'Actie',          create: (t) => addChoiceField(t, 'Actie', ['Aangemaakt', 'Verlengd', 'Terug actief', 'Bewerkt', 'Gearchiveerd']) },
  { internalName: 'Tijdstip',      label: 'Tijdstip',       create: (t) => addDateField(t, 'Tijdstip', false, true) },
  { internalName: 'OudeWaarde',    label: 'Oude Waarde',    create: (t) => addTextField(t, 'OudeWaarde', false, true) },
  { internalName: 'NieuweWaarde',  label: 'Nieuwe Waarde',  create: (t) => addTextField(t, 'NieuweWaarde', false, true) },
  { internalName: 'Opmerking',     label: 'Opmerking',      create: (t) => addTextField(t, 'Opmerking', false, true) },
];

// ── SetupService ──────────────────────────────────────────────

export class SetupService {
  public async isCurrentUserSiteOwner(): Promise<boolean> {
    try {
      const sp = getSP();
      const currentUser = await sp.web.currentUser.select('Id', 'IsSiteAdmin')() as { Id: number; IsSiteAdmin: boolean };
      if (currentUser.IsSiteAdmin) return true;
      const owners = await sp.web.associatedOwnerGroup.users.select('Id')();
      return (owners as { Id: number }[]).some((u) => u.Id === currentUser.Id);
    } catch {
      return false;
    }
  }

  public async lijstBestaat(titel: string): Promise<boolean> {
    try {
      await getSP().web.lists.getByTitle(titel).select('Id')();
      return true;
    } catch {
      return false;
    }
  }

  public async getBestaandeKolommen(lijstTitel: string): Promise<Set<string>> {
    try {
      const fields = await getSP().web.lists
        .getByTitle(lijstTitel)
        .fields.select('InternalName')
        .filter(`Hidden eq false and ReadOnlyField eq false`)();
      return new Set((fields as { InternalName: string }[]).map((f) => f.InternalName));
    } catch {
      return new Set();
    }
  }

  public async scanStructuren(): Promise<ISetupItem[]> {
    const [a, z, s, l] = await Promise.all([
      this.lijstBestaat(LIST_NAMES.AFWEZIGHEDEN),
      this.lijstBestaat(LIBRARY_NAMES.ZIEKTEBRIEFJES),
      this.lijstBestaat(LIST_NAMES.HR_SETTINGS),
      this.lijstBestaat(LIST_NAMES.AUDIT_LOG),
    ]);
    return [
      { id: 'afwezigheden',   label: LIST_NAMES.AFWEZIGHEDEN,        beschrijving: 'Hoofdlijst met alle afwezigheidsdossiers (14 kolommen)',         status: a ? 'bestaat' : 'ontbreekt' },
      { id: 'ziektebriefjes', label: LIBRARY_NAMES.ZIEKTEBRIEFJES,   beschrijving: 'Document library voor ziektebriefje bestanden (7 kolommen)',     status: z ? 'bestaat' : 'ontbreekt' },
      { id: 'hrSettings',     label: LIST_NAMES.HR_SETTINGS,         beschrijving: 'Configuratielijst voor CC-adressen en instellingen (3 kolommen)', status: s ? 'bestaat' : 'ontbreekt' },
      { id: 'auditLog',       label: LIST_NAMES.AUDIT_LOG,           beschrijving: 'Wijzigingshistoriek per afwezigheidsdossier (6 kolommen)',        status: l ? 'bestaat' : 'ontbreekt' },
    ];
  }

  private async provisionStructuur(
    titel: string,
    beschrijving: string,
    lijstType: 100 | 101,
    velden: IFieldDef[],
    onVoortgang: (b: string) => void
  ): Promise<number> {
    const sp = getSP();
    let aangemaakt = 0;

    if (!(await this.lijstBestaat(titel))) {
      onVoortgang(`"${titel}" aanmaken...`);
      await sp.web.lists.add(titel, beschrijving, lijstType);
      aangemaakt++;
    } else {
      onVoortgang(`"${titel}" bestaat al — kolommen controleren...`);
    }

    const bestaand = await this.getBestaandeKolommen(titel);
    for (const veld of velden) {
      if (bestaand.has(veld.internalName)) continue;
      onVoortgang(`Kolom "${veld.label}" toevoegen...`);
      await veld.create(titel);
      // Weergavenaam instellen als die verschilt van de interne naam
      if (veld.label !== veld.internalName) {
        await sp.web.lists.getByTitle(titel).fields
          .getByInternalNameOrTitle(veld.internalName)
          .update({ Title: veld.label });
      }
      aangemaakt++;
    }

    // Alle velden toevoegen aan de standaard view
    onVoortgang(`Standaard view bijwerken voor "${titel}"...`);
    try {
      const viewData = await sp.web.lists.getByTitle(titel).defaultView.fields() as { Items: string[] };
      const viewVelden = new Set(viewData.Items);
      for (const veld of velden) {
        if (!viewVelden.has(veld.internalName)) {
          await sp.web.lists.getByTitle(titel).defaultView.fields.add(veld.internalName);
        }
      }
    } catch {
      // View-update is niet kritisch, provisioning gaat verder
    }

    return aangemaakt;
  }

  public async provisionItem(id: string, onVoortgang: (b: string) => void): Promise<number> {
    switch (id) {
      case 'afwezigheden':
        return this.provisionStructuur(LIST_NAMES.AFWEZIGHEDEN, 'Overzicht van alle medewerkerafwezigheden', 100, AFWEZIGHEDEN_FIELDS, onVoortgang);
      case 'ziektebriefjes':
        return this.provisionStructuur(LIBRARY_NAMES.ZIEKTEBRIEFJES, 'Document library voor ziektebriefjes', 101, ZIEKTEBRIEFJES_FIELDS, onVoortgang);
      case 'hrSettings':
        return this.provisionStructuur(LIST_NAMES.HR_SETTINGS, 'HR configuratie-instellingen', 100, HR_SETTINGS_FIELDS, onVoortgang);
      case 'auditLog':
        return this.provisionStructuur(LIST_NAMES.AUDIT_LOG, 'Automatisch bijgehouden wijzigingshistoriek', 100, AUDIT_LOG_FIELDS, onVoortgang);
      default:
        throw new Error(`Onbekend item: ${id}`);
    }
  }

  public async provisionAlles(
    onVoortgang: (b: string) => void,
    onItemUpdate: (id: string, status: SetupItemStatus, aantal?: number, fout?: string) => void
  ): Promise<void> {
    for (const id of ['afwezigheden', 'ziektebriefjes', 'hrSettings', 'auditLog']) {
      onItemUpdate(id, 'bezig');
      try {
        const aantal = await this.provisionItem(id, onVoortgang);
        onItemUpdate(id, 'klaar', aantal);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onItemUpdate(id, 'fout', 0, msg);
      }
    }
  }
}

export const setupService = new SetupService();

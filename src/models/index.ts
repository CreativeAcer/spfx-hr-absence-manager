// ============================================================
// models/index.ts
// ============================================================

export type AfwezigheidStatus = 'Ziekteverlof' | 'Verlengd' | 'Actief' | 'Gearchiveerd' | 'Genegeerd';
export type RedenAfwezigheid = 'Ziekte' | 'Arbeidsongeval' | 'Burnout' | 'Andere';

export interface IAfwezigheid {
  id: number;
  title: string;
  persoon: IPersoon;
  persoonEmail: string;
  afdeling?: string;
  begindatum: Date;
  einddatum: Date;
  origineelEinde?: Date;
  status: AfwezigheidStatus;
  documentLink?: string;
  documentID?: number;
  aantalVerlengingen: number;
  redenAfwezigheid?: RedenAfwezigheid;
  aangepastDoor?: IPersoon;
  aangepastOp?: Date;
  hrNota?: string;
  dagenTotEinde?: number;
  isVerlopend?: boolean;
}

export interface IPersoon {
  id: number;
  displayName: string;
  email?: string;
}

export interface IZiektebriefDocument {
  id: number;
  title: string;
  persoon?: IPersoon;
  afwezigheidID?: number;
  status: AfwezigheidStatus;
  documentDatum?: Date;
  aanvangsDatum?: Date;
  eindDatum?: Date;
  opmerkingen?: string;
  serverRelativeUrl: string;
  fileName: string;
}

export interface IHrSettings {
  ccEmailAdressen: string[];
  waarschuwingsDagenVerval: number;
  afzenderNaam: string;
  maxVerlengingen: number;
}

export type AuditActie = 'Aangemaakt' | 'Verlengd' | 'Terug actief' | 'Bewerkt' | 'Gearchiveerd';

export interface IAuditEntry {
  id: number;
  title: string;
  afwezigheidID: number;
  actie: AuditActie;
  gewijzigdDoor: IPersoon;
  tijdstip: Date;
  oudeWaarde?: string;
  nieuweWaarde?: string;
  opmerking?: string;
}

export interface IVerlengFormData {
  nieuweEinddatum: Date;
  opmerking?: string;
  hrNota?: string;
}

export interface ITeRugActiefFormData {
  definitieveEinddatum: Date;
  opmerking?: string;
  hrNota?: string;
}

export interface IKpiData {
  totaalActief: number;
  verlopendDezeWeek: number;
  verlengdVandaag: number;
  gemiddeldeDuurDagen: number;
}

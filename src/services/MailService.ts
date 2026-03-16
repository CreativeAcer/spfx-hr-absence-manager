// ============================================================
// services/MailService.ts
// Mail via Microsoft Graph /me/sendMail
// (SharePoint sendEmail API is retired since 2024)
// ============================================================
import { getGraph } from '../config/pnpjsConfig';
import { IAfwezigheid, IHrSettings } from '../models';

export type MailType = 'verlenging' | 'terug_actief';

interface IMailOpties {
  afwezigheid: IAfwezigheid;
  mailType: MailType;
  settings: IHrSettings;
  extra?: {
    nieuweEinddatum?: Date;
    opmerking?: string;
  };
}

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function bouwMail(opties: IMailOpties): { onderwerp: string; inhoud: string } {
  const { afwezigheid, mailType, extra } = opties;
  const naam = afwezigheid.persoon.displayName;
  const afdeling = afwezigheid.afdeling ?? 'N/A';
  const begin = formatDatum(afwezigheid.begindatum);
  const nieuwEinde = extra?.nieuweEinddatum ? formatDatum(extra.nieuweEinddatum) : 'N/A';
  const opmerking = extra?.opmerking ?? '';

  if (mailType === 'verlenging') {
    return {
      onderwerp: `Verlenging afwezigheid - ${naam}`,
      inhoud: `<html><body style="font-family:Segoe UI,sans-serif;color:#323130">
        <h2 style="color:#0078d4">Verlenging Afwezigheid</h2>
        <p>De afwezigheid van <strong>${naam}</strong> werd verlengd.</p>
        <table style="border-collapse:collapse;max-width:480px;width:100%">
          <tr><td style="padding:8px;background:#f3f2f1"><strong>Medewerker</strong></td><td style="padding:8px">${naam}</td></tr>
          <tr><td style="padding:8px;background:#f3f2f1"><strong>Afdeling</strong></td><td style="padding:8px">${afdeling}</td></tr>
          <tr><td style="padding:8px;background:#f3f2f1"><strong>Begindatum</strong></td><td style="padding:8px">${begin}</td></tr>
          <tr><td style="padding:8px;background:#f3f2f1"><strong>Nieuwe einddatum</strong></td><td style="padding:8px;color:#0078d4"><strong>${nieuwEinde}</strong></td></tr>
          <tr><td style="padding:8px;background:#f3f2f1"><strong>Aantal verlengingen</strong></td><td style="padding:8px">${(afwezigheid.aantalVerlengingen ?? 0) + 1}</td></tr>
          ${opmerking ? `<tr><td style="padding:8px;background:#f3f2f1"><strong>Opmerking</strong></td><td style="padding:8px">${opmerking}</td></tr>` : ''}
        </table>
        <p style="color:#605e5c;font-size:12px">Automatisch bericht — HR Ziektebriefjes</p>
      </body></html>`,
    };
  }

  const duur = extra?.nieuweEinddatum
    ? Math.ceil((extra.nieuweEinddatum.getTime() - afwezigheid.begindatum.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    onderwerp: `Terugkeer medewerker - ${naam}`,
    inhoud: `<html><body style="font-family:Segoe UI,sans-serif;color:#323130">
      <h2 style="color:#107c10">Medewerker Terug Actief</h2>
      <p><strong>${naam}</strong> is terug actief.</p>
      <table style="border-collapse:collapse;max-width:480px;width:100%">
        <tr><td style="padding:8px;background:#f3f2f1"><strong>Medewerker</strong></td><td style="padding:8px">${naam}</td></tr>
        <tr><td style="padding:8px;background:#f3f2f1"><strong>Afdeling</strong></td><td style="padding:8px">${afdeling}</td></tr>
        <tr><td style="padding:8px;background:#f3f2f1"><strong>Begindatum afwezigheid</strong></td><td style="padding:8px">${begin}</td></tr>
        <tr><td style="padding:8px;background:#f3f2f1"><strong>Terugkeerdatum</strong></td><td style="padding:8px;color:#107c10"><strong>${nieuwEinde}</strong></td></tr>
        <tr><td style="padding:8px;background:#f3f2f1"><strong>Totale duur</strong></td><td style="padding:8px">${duur} dagen</td></tr>
        ${opmerking ? `<tr><td style="padding:8px;background:#f3f2f1"><strong>Opmerking</strong></td><td style="padding:8px">${opmerking}</td></tr>` : ''}
      </table>
      <p style="color:#605e5c;font-size:12px">Automatisch bericht — HR Ziektebriefjes</p>
    </body></html>`,
  };
}

function toRecipients(addresses: string[]): { emailAddress: { address: string } }[] {
  return addresses.filter(Boolean).map((address) => ({ emailAddress: { address } }));
}

export class MailService {
  public async stuurNotificatie(opties: IMailOpties): Promise<void> {
    const { onderwerp, inhoud } = bouwMail(opties);
    const { afwezigheid, settings } = opties;

    const to = toRecipients([afwezigheid.persoonEmail]);
    if (to.length === 0) {
      console.warn(`[MailService] Geen emailadres voor ${afwezigheid.persoon.displayName}`);
      return;
    }

    const cc = toRecipients(settings.ccEmailAdressen);

    await getGraph().me.sendMail(
      {
        subject: onderwerp,
        body: { contentType: 'html', content: inhoud },
        toRecipients: to,
        ...(cc.length > 0 && { ccRecipients: cc }),
      },
      false
    );
  }
}

export const mailService = new MailService();

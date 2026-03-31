// ============================================================
// services/AbsenceController.ts
// Orchestrates multi-step business operations that cross
// multiple services (SP write → document update → audit → mail).
//
// Keeping this logic here instead of in a React hook means:
//  - Operations are testable without rendering components
//  - The hook stays thin (state management only)
//  - Transactional sequences are easy to read in one place
// ============================================================
import { IAfwezigheid, IVerlengFormData, ITeRugActiefFormData, IHrSettings, IZiektebriefDocument } from '../models';
import { afwezighedenService } from './AfwezighedenService';
import { documentService } from './DocumentService';
import { auditService } from './AuditService';
import { mailService } from './MailService';

export class AbsenceController {
  public async verleng(
    id: number,
    formData: IVerlengFormData,
    afwezigheid: IAfwezigheid,
    settings: IHrSettings
  ): Promise<void> {
    await afwezighedenService.verlengAfwezigheid(id, formData, afwezigheid);

    if (afwezigheid.documentID) {
      await documentService.updateDocumentMetadata(afwezigheid.documentID, 'Verlengd', formData.nieuweEinddatum);
    }

    await auditService.logActie({
      afwezigheidId: id,
      actie: 'Verlengd',
      persoonNaam: afwezigheid.persoon.displayName,
      oudeWaarde: { einddatum: afwezigheid.einddatum, status: afwezigheid.status },
      nieuweWaarde: { einddatum: formData.nieuweEinddatum, status: 'Verlengd' },
      opmerking: formData.opmerking,
    });

    void mailService.stuurNotificatie({
      afwezigheid,
      mailType: 'verlenging',
      settings,
      extra: { nieuweEinddatum: formData.nieuweEinddatum, opmerking: formData.opmerking },
    }).catch((err) => console.warn('[Mail] Verzending mislukt (niet-blokkerend):', err));
  }

  public async zetTeRugActief(
    id: number,
    formData: ITeRugActiefFormData,
    afwezigheid: IAfwezigheid,
    settings: IHrSettings
  ): Promise<void> {
    await afwezighedenService.zetTeRugActief(id, formData);

    if (afwezigheid.documentID) {
      await documentService.updateDocumentMetadata(afwezigheid.documentID, 'Actief', formData.definitieveEinddatum);
    }

    await auditService.logActie({
      afwezigheidId: id,
      actie: 'Terug actief',
      persoonNaam: afwezigheid.persoon.displayName,
      oudeWaarde: { status: afwezigheid.status },
      nieuweWaarde: { status: 'Actief', einddatum: formData.definitieveEinddatum },
      opmerking: formData.opmerking,
    });

    void mailService.stuurNotificatie({
      afwezigheid,
      mailType: 'terug_actief',
      settings,
      extra: { nieuweEinddatum: formData.definitieveEinddatum, opmerking: formData.opmerking },
    }).catch((err) => console.warn('[Mail] Verzending mislukt (niet-blokkerend):', err));
  }

  public async maakAfwezigheidAan(
    doc: IZiektebriefDocument,
    begindatum: Date,
    einddatum: Date
  ): Promise<void> {
    const afwezigheidId = await afwezighedenService.maakAfwezigheidVanDocument(doc, begindatum, einddatum);

    await auditService.logActie({
      afwezigheidId,
      actie: 'Aangemaakt',
      persoonNaam: doc.persoon?.displayName ?? 'Onbekend',
      nieuweWaarde: { begindatum, einddatum, status: 'Ziekteverlof' },
    });
  }
}

export const absenceController = new AbsenceController();

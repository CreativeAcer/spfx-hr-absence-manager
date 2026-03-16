// ============================================================
// hooks/useAfwezigheden.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  IAfwezigheid,
  IHrSettings,
  IKpiData,
  IVerlengFormData,
  ITeRugActiefFormData,
  IZiektebriefDocument,
} from '../models';
import { afwezighedenService } from '../services/AfwezighedenService';
import { documentService } from '../services/DocumentService';
import { settingsService } from '../services/SettingsService';
import { mailService } from '../services/MailService';
import { auditService } from '../services/AuditService';

export interface IAfwezighedenState {
  afwezigheden: IAfwezigheid[];
  pendingDocumenten: IZiektebriefDocument[];
  settings: IHrSettings | undefined;
  kpis: IKpiData | undefined;
  isLoading: boolean;
  isActieBezig: boolean;
  fout: string | undefined;
}

export interface IAfwezighedenActions {
  herlaad: () => Promise<void>;
  verleng: (id: number, formData: IVerlengFormData) => Promise<void>;
  zetTeRugActief: (id: number, formData: ITeRugActiefFormData) => Promise<void>;
  maakAfwezigheidAan: (doc: IZiektebriefDocument, begindatum: Date, einddatum: Date) => Promise<void>;
  negeerDocument: (id: number) => Promise<void>;
}

export function useAfwezigheden(): IAfwezighedenState & IAfwezighedenActions {
  const [afwezigheden, setAfwezigheden] = useState<IAfwezigheid[]>([]);
  const [pendingDocumenten, setPendingDocumenten] = useState<IZiektebriefDocument[]>([]);
  const [settings, setSettings] = useState<IHrSettings | undefined>(undefined);
  const [kpis, setKpis] = useState<IKpiData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isActieBezig, setIsActieBezig] = useState(false);
  const [fout, setFout] = useState<string | undefined>(undefined);

  const laadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setFout(undefined);
    const [afwezighedenResult, pendingResult, settingsResult] = await Promise.all([
      afwezighedenService.getActieveAfwezigheden().then(
        (v) => ({ ok: true as const, value: v }),
        (e) => ({ ok: false as const, error: e })
      ),
      documentService.getOngekoepeldeDocumenten().then(
        (v) => ({ ok: true as const, value: v }),
        () => ({ ok: true as const, value: [] as IZiektebriefDocument[] })
      ),
      settingsService.getSettings().then(
        (v) => ({ ok: true as const, value: v }),
        () => ({ ok: true as const, value: undefined as IHrSettings | undefined })
      ),
    ]);

    if (afwezighedenResult.ok) {
      setAfwezigheden(afwezighedenResult.value);
      setKpis(afwezighedenService.berekenKpis(afwezighedenResult.value));
    } else {
      console.error('[useAfwezigheden] Laad fout:', afwezighedenResult.error);
      setFout('Kon de afwezigheidsgegevens niet laden. Controleer je rechten of probeer opnieuw.');
    }

    setPendingDocumenten(pendingResult.value);
    setSettings(settingsResult.value);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    laadData().catch(console.error);
  }, [laadData]);

  const verleng = useCallback(
    async (id: number, formData: IVerlengFormData): Promise<void> => {
      if (!settings) throw new Error('Settings niet geladen');
      setIsActieBezig(true);
      try {
        const item = afwezigheden.find((a) => a.id === id);
        if (!item) throw new Error('Afwezigheid niet gevonden');

        await afwezighedenService.verlengAfwezigheid(id, formData, item);

        if (item.documentID) {
          await documentService.updateDocumentMetadata(item.documentID, 'Verlengd', formData.nieuweEinddatum);
        }

        await auditService.logActie({
          afwezigheidId: id,
          actie: 'Verlengd',
          persoonNaam: item.persoon.displayName,
          oudeWaarde: { einddatum: item.einddatum, status: item.status },
          nieuweWaarde: { einddatum: formData.nieuweEinddatum, status: 'Verlengd' },
          opmerking: formData.opmerking,
        });

        mailService.stuurNotificatie({
          afwezigheid: item,
          mailType: 'verlenging',
          settings,
          extra: { nieuweEinddatum: formData.nieuweEinddatum, opmerking: formData.opmerking },
        }).catch((err) => console.warn('[Mail] Verzending mislukt (niet-blokkerend):', err));

        await laadData();
      } finally {
        setIsActieBezig(false);
      }
    },
    [afwezigheden, settings, laadData]
  );

  const zetTeRugActief = useCallback(
    async (id: number, formData: ITeRugActiefFormData): Promise<void> => {
      if (!settings) throw new Error('Settings niet geladen');
      setIsActieBezig(true);
      try {
        const item = afwezigheden.find((a) => a.id === id);
        if (!item) throw new Error('Afwezigheid niet gevonden');

        await afwezighedenService.zetTeRugActief(id, formData);

        if (item.documentID) {
          await documentService.updateDocumentMetadata(item.documentID, 'Actief', formData.definitieveEinddatum);
        }

        await auditService.logActie({
          afwezigheidId: id,
          actie: 'Terug actief',
          persoonNaam: item.persoon.displayName,
          oudeWaarde: { status: item.status },
          nieuweWaarde: { status: 'Actief', einddatum: formData.definitieveEinddatum },
          opmerking: formData.opmerking,
        });

        mailService.stuurNotificatie({
          afwezigheid: item,
          mailType: 'terug_actief',
          settings,
          extra: { nieuweEinddatum: formData.definitieveEinddatum, opmerking: formData.opmerking },
        }).catch((err) => console.warn('[Mail] Verzending mislukt (niet-blokkerend):', err));

        await laadData();
      } finally {
        setIsActieBezig(false);
      }
    },
    [afwezigheden, settings, laadData]
  );

  const maakAfwezigheidAan = useCallback(
    async (doc: IZiektebriefDocument, begindatum: Date, einddatum: Date): Promise<void> => {
      setIsActieBezig(true);
      try {
        await afwezighedenService.maakAfwezigheidVanDocument(doc, begindatum, einddatum);
        await laadData();
      } finally {
        setIsActieBezig(false);
      }
    },
    [laadData]
  );

  const negeerDocument = useCallback(
    async (id: number): Promise<void> => {
      setIsActieBezig(true);
      try {
        await documentService.negeerDocument(id);
        setPendingDocumenten((prev) => prev.filter((d) => d.id !== id));
      } finally {
        setIsActieBezig(false);
      }
    },
    []
  );

  return {
    afwezigheden, pendingDocumenten, settings, kpis,
    isLoading, isActieBezig, fout,
    herlaad: laadData, verleng, zetTeRugActief, maakAfwezigheidAan, negeerDocument,
  };
}

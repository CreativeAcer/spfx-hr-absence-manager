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
import { absenceController } from '../services/AbsenceController';
import { DREMPEL_DAGEN } from '../constants';

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

    // Load settings first so the warning threshold is correct for absence mapping.
    const loadedSettings = await settingsService.getSettings().catch(() => undefined);
    const waarschuwingsDagen = loadedSettings?.waarschuwingsDagenVerval ?? DREMPEL_DAGEN.WAARSCHUWING;

    const [afwezighedenResult, pendingResult] = await Promise.all([
      afwezighedenService.getActieveAfwezigheden(waarschuwingsDagen).then(
        (v) => ({ ok: true as const, value: v }),
        (e) => ({ ok: false as const, error: e })
      ),
      documentService.getOngekoepeldeDocumenten().then(
        (v) => ({ ok: true as const, value: v }),
        () => ({ ok: true as const, value: [] as IZiektebriefDocument[] })
      ),
    ]);

    if (afwezighedenResult.ok) {
      setAfwezigheden(afwezighedenResult.value);
      setKpis(afwezighedenService.berekenKpis(afwezighedenResult.value, waarschuwingsDagen));
    } else {
      console.error('[useAfwezigheden] Laad fout:', afwezighedenResult.error);
      setFout('Kon de afwezigheidsgegevens niet laden. Controleer je rechten of probeer opnieuw.');
    }

    setPendingDocumenten(pendingResult.value);
    setSettings(loadedSettings);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    laadData().catch(console.error);
  }, [laadData]);

  const verleng = useCallback(
    async (id: number, formData: IVerlengFormData): Promise<void> => {
      if (!settings) throw new Error('Settings niet geladen');
      const item = afwezigheden.find((a) => a.id === id);
      if (!item) throw new Error('Afwezigheid niet gevonden');
      setIsActieBezig(true);
      try {
        await absenceController.verleng(id, formData, item, settings);
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
      const item = afwezigheden.find((a) => a.id === id);
      if (!item) throw new Error('Afwezigheid niet gevonden');
      setIsActieBezig(true);
      try {
        await absenceController.zetTeRugActief(id, formData, item, settings);
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
        await absenceController.maakAfwezigheidAan(doc, begindatum, einddatum);
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

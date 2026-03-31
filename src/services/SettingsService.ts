// ============================================================
// services/SettingsService.ts
// ============================================================
import { getSP, LIST_NAMES } from '../config/pnpjsConfig';
import { IHrSettings } from '../models';
import { SP_QUERY_LIMITS } from '../constants';

const DEFAULT_SETTINGS: IHrSettings = {
  ccEmailAdressen: [],
  waarschuwingsDagenVerval: 7,
  afzenderNaam: 'HR Afdeling',
  maxVerlengingen: 3,
};

export class SettingsService {
  private cachedSettings: IHrSettings | undefined;

  public async getSettings(): Promise<IHrSettings> {
    if (this.cachedSettings) return this.cachedSettings;

    try {
      const sp = getSP();
      const items = await sp.web.lists
        .getByTitle(LIST_NAMES.HR_SETTINGS)
        .items.select('Title', 'Waarde', 'IsActief')
        .filter(`IsActief eq 1`)
        .top(SP_QUERY_LIMITS.SETTINGS)();

      const map: Record<string, string> = {};
      items.forEach((item: Record<string, string>) => {
        map[item.Title] = item.Waarde;
      });

      this.cachedSettings = {
        ccEmailAdressen: map.CCEmailAdressen
          ? map.CCEmailAdressen.split(';').map((e) => e.trim()).filter(Boolean)
          : DEFAULT_SETTINGS.ccEmailAdressen,
        waarschuwingsDagenVerval: map.WaarschuwingsDagenVerval
          ? parseInt(map.WaarschuwingsDagenVerval, 10)
          : DEFAULT_SETTINGS.waarschuwingsDagenVerval,
        afzenderNaam: map.AfzenderNaam ?? DEFAULT_SETTINGS.afzenderNaam,
        maxVerlengingen: map.MaxVerlengingen
          ? parseInt(map.MaxVerlengingen, 10)
          : DEFAULT_SETTINGS.maxVerlengingen,
      };
    } catch {
      // Lijst bestaat nog niet (setup niet uitgevoerd) — standaardwaarden teruggeven
      // Niet cachen zodat het opnieuw geprobeerd wordt na setup.
      return { ...DEFAULT_SETTINGS };
    }

    return this.cachedSettings as IHrSettings;
  }

  public clearCache(): void {
    this.cachedSettings = undefined;
  }
}

export const settingsService = new SettingsService();

// ============================================================
// components/dashboard/KpiHeader.tsx
// ============================================================
import * as React from 'react';
import { Stack, Text } from '@fluentui/react';
import { IKpiData } from '../../models';
import styles from './KpiHeader.module.scss';

interface IKpiHeaderProps {
  kpis: IKpiData;
}

interface IKpiCardProps {
  label: string;
  waarde: number | string;
  emoji: string;
  kleurKlasse: string;
  sublabel?: string;
}

const KpiCard: React.FC<IKpiCardProps> = ({ label, waarde, emoji, kleurKlasse, sublabel }) => (
  <Stack className={`${styles.kpiCard} ${(styles as Record<string, string>)[kleurKlasse]}`} tokens={{ childrenGap: 4 }}>
    <Text className={styles.kpiEmoji}>{emoji}</Text>
    <Text className={styles.kpiWaarde}>{waarde}</Text>
    <Text className={styles.kpiLabel}>{label}</Text>
    {sublabel && <Text className={styles.kpiSublabel}>{sublabel}</Text>}
  </Stack>
);

export const KpiHeader: React.FC<IKpiHeaderProps> = ({ kpis }) => (
  <Stack horizontal tokens={{ childrenGap: 12 }} className={styles.kpiContainer} wrap>
    <KpiCard emoji="🏥" waarde={kpis.totaalActief}          label="Actieve afwezigheden"  kleurKlasse="blauw" />
    <KpiCard emoji="⚠️" waarde={kpis.verlopendDezeWeek}     label="Verlopen deze week"    kleurKlasse={kpis.verlopendDezeWeek > 0 ? 'oranje' : 'groen'} sublabel="Vereisen aandacht" />
    <KpiCard emoji="🔄" waarde={kpis.verlengdVandaag}       label="Verlengd vandaag"      kleurKlasse="paars" />
    <KpiCard emoji="📅" waarde={`${kpis.gemiddeldeDuurDagen} dgn`} label="Gemiddelde duur" kleurKlasse="grijs" sublabel="Van actieve dossiers" />
  </Stack>
);

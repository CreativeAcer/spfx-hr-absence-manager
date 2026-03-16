// ============================================================
// components/table/StatusBadge.tsx
// ============================================================
import * as React from 'react';
import { AfwezigheidStatus } from '../../models';
import styles from './StatusBadge.module.scss';

interface IStatusBadgeProps {
  status: AfwezigheidStatus;
}

const STATUS_CONFIG: Record<AfwezigheidStatus, { label: string; klasse: string; emoji: string }> = {
  'Ziekteverlof': { label: 'Ziekteverlof', klasse: 'actief',       emoji: '🤒' },
  'Verlengd':     { label: 'Verlengd',     klasse: 'verlengd',     emoji: '🟡' },
  'Actief':       { label: 'Actief',       klasse: 'teRugActief',  emoji: '✅' },
  'Gearchiveerd': { label: 'Gearchiveerd', klasse: 'gearchiveerd', emoji: '📁' },
  'Genegeerd':    { label: 'Genegeerd',    klasse: 'gearchiveerd', emoji: '🚫' },
};

export const StatusBadge: React.FC<IStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Ziekteverlof;
  return (
    <span className={`${styles.badge} ${(styles as Record<string, string>)[config.klasse]}`}>
      {config.emoji} {config.label}
    </span>
  );
};

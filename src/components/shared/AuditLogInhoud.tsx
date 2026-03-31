// ============================================================
// components/shared/AuditLogInhoud.tsx
// Herbruikbare audit-log inhoud — zonder Panel-wrapper.
// Wordt gebruikt door AuditLogPanel én inline in modals.
// ============================================================
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Stack, Text, Spinner, SpinnerSize, Icon, Separator } from '@fluentui/react';
import { IAuditEntry } from '../../models';
import { auditService } from '../../services/AuditService';
import { AuditEntryItem } from './AuditEntryItem';
import styles from './AuditLogPanel.module.scss';

interface IAuditLogInhoudProps {
  afwezigheidId: number;
  /** Lazy: enkel laden wanneer true. Standaard altijd laden. */
  laden?: boolean;
}

export const AuditLogInhoud: React.FC<IAuditLogInhoudProps> = ({ afwezigheidId, laden = true }) => {
  const [entries, setEntries] = useState<IAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fout, setFout] = useState<string | undefined>(undefined);
  const [heeftGeladen, setHeeftGeladen] = useState(false);

  // Reset when the absence changes so we don't show stale history.
  useEffect(() => {
    setHeeftGeladen(false);
    setEntries([]);
    setFout(undefined);
  }, [afwezigheidId]);

  useEffect(() => {
    if (!laden || heeftGeladen) return;
    setIsLoading(true);
    setFout(undefined);
    auditService
      .getAuditLogVoorAfwezigheid(afwezigheidId)
      .then((data) => { setEntries(data); setHeeftGeladen(true); })
      .catch(() => setFout('Kon de historiek niet laden.'))
      .finally(() => setIsLoading(false));
  }, [afwezigheidId, laden, heeftGeladen]);

  if (isLoading) {
    return (
      <Stack horizontalAlign="center" styles={{ root: { padding: '12px 0' } }}>
        <Spinner size={SpinnerSize.small} label="Historiek laden..." />
      </Stack>
    );
  }
  if (fout) {
    return <Text styles={{ root: { color: '#a4262c', fontSize: 12 } }}>{fout}</Text>;
  }
  if (entries.length === 0) {
    return (
      <Stack horizontalAlign="center" tokens={{ childrenGap: 6 }} styles={{ root: { padding: '8px 0' } }}>
        <Icon iconName="History" styles={{ root: { fontSize: 24, color: '#c8c6c4' } }} />
        <Text variant="small" styles={{ root: { color: '#605e5c' } }}>Nog geen wijzigingen geregistreerd</Text>
      </Stack>
    );
  }
  return (
    <>
      <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
        {entries.length} wijziging{entries.length === 1 ? '' : 'en'}
      </Text>
      <Separator />
      <Stack tokens={{ childrenGap: 10 }}>
        {entries.map((entry) => <AuditEntryItem key={entry.id} entry={entry} />)}
      </Stack>
    </>
  );
};

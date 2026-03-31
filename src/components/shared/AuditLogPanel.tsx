// ============================================================
// components/shared/AuditLogPanel.tsx
// ============================================================
import * as React from 'react';
import { Panel, PanelType, Stack } from '@fluentui/react';
import { AuditLogInhoud } from './AuditLogInhoud';

interface IAuditLogPanelProps {
  afwezigheidId: number;
  isOpen: boolean;
  onSluit: () => void;
}

export const AuditLogPanel: React.FC<IAuditLogPanelProps> = ({ afwezigheidId, isOpen, onSluit }) => (
  <Panel
    isOpen={isOpen}
    onDismiss={onSluit}
    type={PanelType.medium}
    headerText="Wijzigingshistoriek"
    closeButtonAriaLabel="Sluiten"
  >
    <Stack tokens={{ childrenGap: 12 }} styles={{ root: { paddingTop: 16 } }}>
      <AuditLogInhoud afwezigheidId={afwezigheidId} laden={isOpen} />
    </Stack>
  </Panel>
);

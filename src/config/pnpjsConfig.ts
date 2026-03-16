// ============================================================
// config/pnpjsConfig.ts
// ============================================================
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import { graphfi, GraphFI, SPFx as GraphSPFx } from '@pnp/graph';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import '@pnp/sp/fields';
import '@pnp/sp/views';
import '@pnp/sp/site-groups/web';
import '@pnp/sp/site-users/web';
import '@pnp/sp/sputilities';
import '@pnp/graph/users';
import '@pnp/graph/mail';

let _sp: SPFI;
let _graph: GraphFI;

export function initializePnPjs(context: WebPartContext): void {
  _sp = spfi().using(SPFx(context));
  _graph = graphfi().using(GraphSPFx(context));
}

export const getSP = (): SPFI => {
  if (!_sp) throw new Error('PnPjs SP niet geïnitialiseerd.');
  return _sp;
};

export const getGraph = (): GraphFI => {
  if (!_graph) throw new Error('PnPjs Graph niet geïnitialiseerd.');
  return _graph;
};

export const LIST_NAMES = {
  AFWEZIGHEDEN: 'Afwezigheden',
  HR_SETTINGS: 'HR Settings',
  AUDIT_LOG: 'HR Audit Log',
} as const;

export const LIBRARY_NAMES = {
  ZIEKTEBRIEFJES: 'Ziektebriefjes',
} as const;

import { Route } from '@angular/router';

/**
 * Flow-graph authoring types. `data.flow` on each route is the single source of truth
 * for the user-flow graph AND the runtime navbar (projected by the colossus extractor).
 */
export interface FlowMeta {
  flowId: string;
  node: string;
  label?: string;
  entry?: boolean;
  edgesTo?: string[];
  showInNavbar?: boolean;
  /** 'all' = every authenticated role; 'admin' = ADMIN only. */
  scope?: 'all' | 'admin';
  /** navbar icon (emoji glyph, mockup only). */
  icon?: string;
}

export type FlowRoute = Route & {
  data?: { flow?: FlowMeta } & Record<string, unknown>;
  children?: FlowRoute[];
};

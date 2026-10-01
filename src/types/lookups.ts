export interface TicketFieldLookup {
  id: number;
  title: string;
  type: string;
  options?: Map<string, string>; // value -> name
}

export interface TriggerCategoryLookup {
  name: string;
  position: number;
}

export interface ZendeskLookups {
  subdomain: string;
  groups: Map<number, string>;
  users: Map<number, string>;
  organizations: Map<number, string>;
  ticketFields: Map<number, TicketFieldLookup>;
  forms: Map<number, string>;
  brands: Map<number, string>;
  customRoles: Map<number | string, string>;
  schedules: Map<number | string, string>;
  triggerCategories: Map<number | string, TriggerCategoryLookup>;
}

export function createEmptyLookups(): ZendeskLookups {
  return {
    subdomain: 'demo-enterprise',
    groups: new Map(),
    users: new Map(),
    organizations: new Map(),
    ticketFields: new Map(),
    forms: new Map(),
    brands: new Map(),
    customRoles: new Map<number | string, string>(),
    schedules: new Map<number | string, string>(),
    triggerCategories: new Map<number | string, TriggerCategoryLookup>(),
  };
}
